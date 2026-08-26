-- Create a non-sensitive starting history for owners that existed before
-- account audit logging was enabled. Emails are intentionally not copied.

insert into public.account_audit_logs (
  action,
  actor_id,
  actor_name,
  target_id,
  target_name,
  target_role,
  details
)
select
  'ACCOUNT_PROVISIONED',
  null,
  'Hệ thống',
  profile.id,
  coalesce(nullif(profile.full_name, ''), 'Chưa đặt tên'),
  profile.role,
  'Khởi tạo lịch sử: tài khoản Chủ trung tâm đã hoạt động trước khi bật nhật ký tài khoản.'
from public.profiles as profile
where profile.role = 'owner'
  and profile.is_active = true
  and not exists (
    select 1
    from public.account_audit_logs as audit
    where audit.target_id = profile.id
  );
