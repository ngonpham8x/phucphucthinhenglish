-- Migration 008: Cấp toàn quyền Chủ trung tâm (Owner) cho email phucphucthinhenglish@gmail.com
-- Thêm email vào bảng bootstrap allowlist và nâng quyền trong bảng profiles

insert into public.owner_bootstrap_allowlist (email)
values ('phucphucthinhenglish@gmail.com')
on conflict (email) do nothing;

update public.profiles
set role = 'owner'::public.app_role,
    is_active = true,
    permissions = '{}'::jsonb
where lower(email) = 'phucphucthinhenglish@gmail.com'
   or id in (select id from auth.users where lower(email) = 'phucphucthinhenglish@gmail.com');
