-- Trigger functions do not need to be callable from browser REST/RPC clients.
-- Trigger execution remains unchanged; service-role administration remains allowed.
begin;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.promote_bootstrap_owner() from public, anon, authenticated;
revoke execute on function public.set_center_data_updated_at() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.promote_bootstrap_owner() to service_role;
grant execute on function public.set_center_data_updated_at() to service_role;

-- This helper is required by center_data's authenticated-user RLS policies.
revoke execute on function public.is_active_center_user() from public, anon;
grant execute on function public.is_active_center_user() to authenticated, service_role;
commit;
