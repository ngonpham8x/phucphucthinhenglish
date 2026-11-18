import { createClient } from '@supabase/supabase-js';

const STAFF_PERMISSION_SHAPE = {
  student: ['view', 'add', 'edit', 'delete', 'export'],
  teacher: ['view', 'edit', 'delete'],
  tuition: ['view', 'collect', 'delete', 'showDebt'],
  grade: ['view', 'edit'],
  excel: ['import', 'export'],
  report: ['view', 'revenue'],
} as const;

const OWNER_PERMISSIONS = {
  student: { view: true, add: true, edit: true, delete: true, export: true },
  teacher: { view: true, edit: true, delete: true },
  tuition: { view: true, collect: true, delete: true, showDebt: true },
  grade: { view: true, edit: true },
  excel: { import: true, export: true },
  report: { view: true, revenue: true },
};

type AccountAuditAction = 'ACCOUNT_PROVISIONED' | 'ACCOUNT_UPDATED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED';

function roleLabel(role: 'owner' | 'staff') {
  return role === 'owner' ? 'Chủ trung tâm' : 'Nhân viên';
}

function permissionSummary(permissions: Record<string, Record<string, boolean>>) {
  const labels: Record<string, Record<string, string>> = {
    student: { view: 'xem học viên', add: 'thêm học viên', edit: 'sửa học viên', delete: 'xóa học viên', export: 'xuất học viên' },
    teacher: { view: 'xem giáo viên', edit: 'sửa giáo viên', delete: 'xóa giáo viên' },
    tuition: { view: 'xem học phí', collect: 'thu học phí', delete: 'xóa phiếu thu', showDebt: 'xem công nợ' },
    grade: { view: 'xem điểm', edit: 'sửa điểm' },
    excel: { import: 'nhập Excel', export: 'xuất Excel' },
    report: { view: 'xem báo cáo', revenue: 'xem doanh thu' },
  };
  const granted = Object.entries(labels).flatMap(([module, actions]) =>
    Object.entries(actions)
      .filter(([action]) => permissions[module]?.[action] === true)
      .map(([, label]) => label)
  );
  return granted.length > 0 ? `Quyền: ${granted.join(', ')}.` : 'Không cấp quyền riêng.';
}

// Profile mutation and its audit entry commit in one database transaction.
async function updateAccount(client:any,res:any,actorId:string,targetId:string,name:string,role:'owner'|'staff',active:boolean,permissions:unknown,action:AccountAuditAction,details:string) {
  const {error}=await client.rpc('admin_update_profile_secure',{
    p_actor:actorId,p_target:targetId,p_name:name,p_role:role,p_active:active,
    p_permissions:permissions,p_action:action,p_details:details,
  });
  if(!error) return true;
  const guarded=['SELF_OWNER_CHANGE','LAST_ACTIVE_OWNER','CENTER_FORBIDDEN'].some(code=>error.message?.includes(code));
  json(res,guarded ? 403 : 503,{error:guarded ? 'Không thể tự hạ quyền, tự khóa hoặc vô hiệu hóa Chủ trung tâm cuối cùng.' : 'Không thể lưu tài khoản và nhật ký. Hãy kiểm tra migration 007.'});
  return false;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recentRequests = new Map<string, { count: number; resetAt: number }>();

function json(res: any, status: number, body: Record<string, unknown>) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(status).json(body);
}

function getBearerToken(req: any): string | null {
  const value = req.headers?.authorization;
  if (typeof value !== 'string' || !value.startsWith('Bearer ')) return null;
  const token = value.slice(7).trim();
  return token || null;
}

function requestIsAllowed(req: any): boolean {
  const origin = req.headers?.origin;
  if (!origin) return true; // Navigation-free API calls can omit Origin; JWT is still required.

  const configuredOrigins = [process.env.APP_URL, ...(process.env.ALLOWED_ORIGINS || '').split(',')]
    .filter(Boolean)
    .map((item) => item!.trim().replace(/\/$/, ''));
  const requestOrigin = String(origin).replace(/\/$/, '');
  const requestHost = req.headers?.host ? `https://${req.headers.host}`.replace(/\/$/, '') : '';

  return configuredOrigins.includes(requestOrigin) || requestOrigin === requestHost;
}

function underRateLimit(req: any): boolean {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  const ip = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : 'unknown';
  const now = Date.now();
  const current = recentRequests.get(ip);
  if (!current || current.resetAt < now) {
    recentRequests.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return true;
  }
  if (current.count >= 10) return false;
  current.count += 1;
  return true;
}

function getBody(req: any): Record<string, unknown> | null {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body as Record<string, unknown>;
  if (typeof req.body !== 'string' || req.body.length > 10_000) return null;
  try {
    return JSON.parse(req.body) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeStaffPermissions(candidate: unknown) {
  const input = candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    ? candidate as Record<string, unknown>
    : {};
  return Object.fromEntries(Object.entries(STAFF_PERMISSION_SHAPE).map(([module, actions]) => {
    const inputModule = input[module] && typeof input[module] === 'object' && !Array.isArray(input[module])
      ? input[module] as Record<string, unknown>
      : {};
    return [module, Object.fromEntries(actions.map((action) => [action, inputModule[action] === true]))];
  }));
}

function serverClient() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

async function authorizeOwner(req: any, res: any) {
  const client = serverClient();
  if (!client) {
    json(res, 500, { error: 'Máy chủ chưa được cấu hình Supabase.' });
    return null;
  }

  const token = getBearerToken(req);
  if (!token) {
    json(res, 401, { error: 'Thiếu thông tin xác thực.' });
    return null;
  }

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    json(res, 401, { error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    return null;
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, full_name, role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active || profile.role !== 'owner') {
    json(res, 403, { error: 'Chỉ Chủ trung tâm được phép thực hiện thao tác này.' });
    return null;
  }

  return { client, callerId: userData.user.id, callerName: profile.full_name || userData.user.user_metadata?.full_name || 'Chủ trung tâm' };
}

export default async function handler(req: any, res: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (!['GET', 'POST', 'PATCH'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, POST, PATCH');
    return json(res, 405, { error: 'Phương thức không được hỗ trợ.' });
  }
  if (!requestIsAllowed(req)) return json(res, 403, { error: 'Nguồn yêu cầu không được phép.' });
  if (req.method !== 'GET' && !underRateLimit(req)) return json(res, 429, { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' });

  const authorized = await authorizeOwner(req, res);
  if (!authorized) return;
  const { client, callerId } = authorized;

  if (req.method === 'GET') {
    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', callerId)
      .maybeSingle();
    if (error || !data) return json(res, 500, { error: 'Không thể tải tài khoản đang đăng nhập.' });
    return json(res, 200, { users: [data] });
  }

  const body = getBody(req);
  if (!body) return json(res, 400, { error: 'Nội dung yêu cầu không hợp lệ.' });

  if (req.method === 'POST') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim().replace(/\s+/g, ' ') : '';
    const role = body.role === 'owner' || body.role === 'staff' ? body.role : null;

    if (!EMAIL_PATTERN.test(email) || email.length > 254 || fullName.length < 2 || fullName.length > 120 || !role) {
      return json(res, 400, { error: 'Họ tên, email hoặc cấp bậc không hợp lệ.' });
    }
    if (!process.env.APP_URL?.startsWith('https://')) {
      return json(res, 500, { error: 'APP_URL phải là địa chỉ HTTPS đã cấu hình trên máy chủ.' });
    }

    const permissions = role === 'owner' ? OWNER_PERMISSIONS : normalizeStaffPermissions(body.permissions);
    if(role==='staff' && (permissions.tuition.collect || permissions.tuition.delete) && (!permissions.tuition.view || !permissions.tuition.showDebt)) return json(res,400,{error:'Quyền thu/xóa học phí cần quyền xem học phí và xem công nợ.'});
    const { data: existing, error: existingError } = await client
      .from('profiles')
      .select('id, full_name, role, is_active, permissions')
      .eq('email', email)
      .maybeSingle();
    if (existingError) return json(res, 500, { error: 'Không thể kiểm tra tài khoản.' });

    // A known Google user can be promoted without an email invitation or password.
    if (existing) {
      if(existing.id===callerId && role!=='owner') return json(res,400,{error:'Bạn không thể tự hạ quyền Chủ trung tâm của mình.'});
      const details = `Cập nhật cấp bậc: ${roleLabel(existing.role)} → ${roleLabel(role)}. ${role === 'owner' ? 'Cấp toàn quyền Chủ trung tâm.' : permissionSummary(permissions)}`;
      if(!await updateAccount(client,res,callerId,existing.id,fullName,role,true,permissions,'ACCOUNT_UPDATED',details)) return;
      return json(res, 200, { user: { id: existing.id, role }, provisioned: false });
    }

    // This creates no password and sends no email. Supabase links Google later.
    const { data: provisionedUser, error: provisionError } = await client.auth.admin.createUser({
      email,
      user_metadata: { full_name: fullName },
    });
    if (provisionError || !provisionedUser.user) {
      return json(res, 400, { error: 'Không thể cấp quyền Google. Email có thể đã tồn tại hoặc chưa sẵn sàng.' });
    }

    const details=`Cấp quyền Google mới: ${roleLabel(role)}. ${role==='owner' ? 'Cấp toàn quyền Chủ trung tâm.' : permissionSummary(permissions)}`;
    // A failed transaction leaves the new Auth user inactive. Keep the record
    // so the owner can safely retry without deleting a concurrent Google login.
    if(!await updateAccount(client,res,callerId,provisionedUser.user.id,fullName,role,true,permissions,'ACCOUNT_PROVISIONED',details)) return;

    return json(res, 201, { user: { id: provisionedUser.user.id, role }, provisioned: true });
  }

  const userId = typeof body.userId === 'string' ? body.userId : '';
  const active = body.active;
  if (body.action !== 'setActive' || !/^[0-9a-f-]{36}$/i.test(userId) || typeof active !== 'boolean') {
    return json(res, 400, { error: 'Yêu cầu cập nhật không hợp lệ.' });
  }
  if (userId === callerId) return json(res, 400, { error: 'Bạn không thể tự khóa tài khoản của mình.' });

  const { data: target, error: targetError } = await client
    .from('profiles')
    .select('id, full_name, role, is_active, permissions')
    .eq('id', userId)
    .maybeSingle();
  if (targetError || !target) return json(res, 404, { error: 'Không tìm thấy tài khoản.' });

  if(!await updateAccount(client,res,callerId,target.id,target.full_name,target.role,active,target.permissions,
    active ? 'ACCOUNT_UNLOCKED' : 'ACCOUNT_LOCKED',active ? 'Mở khóa tài khoản; có thể đăng nhập Google.' : 'Khóa tài khoản; không thể truy cập hệ thống.')) return;
  return json(res, 200, { success: true });
}
