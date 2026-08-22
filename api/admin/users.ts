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
    .select('id, role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active || profile.role !== 'owner') {
    json(res, 403, { error: 'Chỉ Chủ trung tâm được phép thực hiện thao tác này.' });
    return null;
  }

  return { client, callerId: userData.user.id };
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
      .select('id, full_name, avatar_url, role, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) return json(res, 500, { error: 'Không thể tải danh sách tài khoản.' });
    return json(res, 200, { users: data || [] });
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

    const { data: existing } = await client.from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing) return json(res, 409, { error: 'Email này đã được cấp hoặc đang chờ kích hoạt.' });

    const permissions = role === 'owner' ? OWNER_PERMISSIONS : normalizeStaffPermissions(body.permissions);
    const { data: invitation, error: inviteError } = await client.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: process.env.APP_URL,
    });
    if (inviteError || !invitation.user) {
      return json(res, 400, { error: 'Không thể tạo lời mời. Email có thể đã tồn tại hoặc dịch vụ email chưa được cấu hình.' });
    }

    const { error: profileWriteError } = await client.from('profiles').upsert({
      id: invitation.user.id,
      email,
      full_name: fullName,
      role,
      is_active: true,
      permissions,
    });
    if (profileWriteError) {
      // The invitation already exists. Do not reveal a partially configured account as usable.
      await client.auth.admin.deleteUser(invitation.user.id);
      return json(res, 500, { error: 'Không thể hoàn tất việc cấp quyền cho tài khoản.' });
    }

    return json(res, 201, { user: { id: invitation.user.id, role } });
  }

  const userId = typeof body.userId === 'string' ? body.userId : '';
  const active = body.active;
  if (body.action !== 'setActive' || !/^[0-9a-f-]{36}$/i.test(userId) || typeof active !== 'boolean') {
    return json(res, 400, { error: 'Yêu cầu cập nhật không hợp lệ.' });
  }
  if (userId === callerId) return json(res, 400, { error: 'Bạn không thể tự khóa tài khoản của mình.' });

  const { data: target, error: targetError } = await client
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', userId)
    .maybeSingle();
  if (targetError || !target) return json(res, 404, { error: 'Không tìm thấy tài khoản.' });

  if (!active && target.role === 'owner' && target.is_active) {
    const { count, error: ownerCountError } = await client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'owner')
      .eq('is_active', true);
    if (ownerCountError || (count ?? 0) <= 1) {
      return json(res, 400, { error: 'Không thể khóa Chủ trung tâm cuối cùng.' });
    }
  }

  const { error: updateError } = await client.from('profiles').update({ is_active: active }).eq('id', userId);
  if (updateError) return json(res, 500, { error: 'Không thể cập nhật trạng thái tài khoản.' });
  return json(res, 200, { success: true });
}
