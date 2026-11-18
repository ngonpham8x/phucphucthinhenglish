import { createClient } from "@supabase/supabase-js";
import { PolicyError, type CenterActor } from "./centerPolicy";

export function sendJson(res: any, status: number, body: unknown) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(status).json(body);
}

export function allowedOrigin(req: any) {
  if (!req.headers?.origin) return true;
  const configured = [
    process.env.APP_URL,
    ...(process.env.ALLOWED_ORIGINS || "").split(","),
  ];
  return [...configured, `https://${req.headers.host}`].some(
    (value) => value?.trim().replace(/\/$/, "") === req.headers.origin,
  );
}

export async function authorizeCenter(req: any) {
  const url = process.env.SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret)
    throw new PolicyError("Máy chủ chưa được cấu hình Supabase.", 503);
  const token = String(req.headers?.authorization || "").match(
    /^Bearer (\S+)$/,
  )?.[1];
  if (!token) throw new PolicyError("Thiếu thông tin xác thực.", 401);
  const client = createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { data: identity, error } = await client.auth.getUser(token);
  if (error || !identity.user)
    throw new PolicyError("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", 401);
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,full_name,role,is_active,permissions")
    .eq("id", identity.user.id)
    .maybeSingle();
  if (profileError || !profile?.is_active)
    throw new PolicyError(
      "Tài khoản chưa được cấp quyền hoặc đã bị khóa.",
      403,
    );
  const { data: version, error: versionError } = await client.rpc(
    "app_security_version",
  );
  if (versionError || version !== 7)
    throw new PolicyError(
      "Cần áp dụng migration 007 trên Supabase trước khi truy cập dữ liệu.",
      503,
    );
  return { client, actor: profile as CenterActor };
}
