import { createClient } from '@supabase/supabase-js';

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
  if (!origin) return true;
  const configuredOrigins = [process.env.APP_URL, ...(process.env.ALLOWED_ORIGINS || '').split(',')]
    .filter(Boolean)
    .map((item) => item!.trim().replace(/\/$/, ''));
  const requestOrigin = String(origin).replace(/\/$/, '');
  const requestHost = req.headers?.host ? `https://${req.headers.host}`.replace(/\/$/, '') : '';
  return configuredOrigins.includes(requestOrigin) || requestOrigin === requestHost;
}

function serverClient() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Phương thức không được hỗ trợ.' });
  }
  if (!requestIsAllowed(req)) return json(res, 403, { error: 'Nguồn yêu cầu không được phép.' });

  const client = serverClient();
  if (!client) return json(res, 500, { error: 'Máy chủ chưa được cấu hình Supabase.' });
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: 'Thiếu thông tin xác thực.' });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) return json(res, 401, { error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileError || !profile || !profile.is_active || profile.role !== 'owner') {
    return json(res, 403, { error: 'Chỉ Chủ trung tâm được xem nhật ký tài khoản.' });
  }

  const { data, error } = await client
    .from('account_audit_logs')
    .select('id, occurred_at, action, actor_name, target_name, target_role, details')
    .order('occurred_at', { ascending: false })
    .limit(250);
  if (error) return json(res, 500, { error: 'Chưa thể tải nhật ký tài khoản. Hãy kiểm tra migration 004.' });

  const logs = (data || []).map((item) => ({
    id: item.id,
    occurredAt: item.occurred_at,
    action: item.action,
    actorName: item.actor_name,
    targetName: item.target_name,
    targetRole: item.target_role,
    details: item.details,
  }));
  return json(res, 200, { logs });
}
