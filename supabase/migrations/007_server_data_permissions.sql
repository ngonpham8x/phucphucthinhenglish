begin;

-- Browser sessions can read only their own profile. Center data is projected
-- and field-level mutations are authorized by the Vercel server.
revoke all on table public.center_data from public, anon, authenticated;
grant select, insert, update, delete on table public.center_data to service_role;
drop policy if exists "active users can read center data" on public.center_data;
drop policy if exists "active users can create center data" on public.center_data;
drop policy if exists "active users can update center data" on public.center_data;
alter table public.center_data enable row level security;
alter table public.center_data add column if not exists last_request_id uuid;
alter table public.center_data add column if not exists last_request_actor uuid;

alter table public.profiles alter column permissions set default '{}'::jsonb;
revoke insert, update, delete, truncate, references, trigger on public.profiles from public, anon, authenticated;
revoke all on public.account_audit_logs from public, anon, authenticated;
grant all on public.account_audit_logs to service_role;

create or replace function public.protect_last_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(701107007);
  if old.role = 'owner' and old.is_active and
     (tg_op = 'DELETE' or new.role <> 'owner' or not new.is_active) and
     not exists (select 1 from public.profiles where id <> old.id and role = 'owner' and is_active) then
    raise exception 'LAST_ACTIVE_OWNER' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_last_owner on public.profiles;
create trigger profiles_protect_last_owner before update of role, is_active or delete on public.profiles
for each row execute function public.protect_last_owner();

create or replace function public.admin_update_profile_secure(
  p_actor uuid, p_target uuid, p_name text, p_role public.app_role,
  p_active boolean, p_permissions jsonb, p_action text, p_details text
) returns void language plpgsql security definer set search_path = '' as $$
declare actor public.profiles; target public.profiles;
begin
  perform pg_advisory_xact_lock(701107007);
  select * into actor from public.profiles where id=p_actor for update;
  if actor.id is null or not actor.is_active or actor.role <> 'owner' then
    raise exception 'CENTER_FORBIDDEN';
  end if;
  select * into target from public.profiles where id=p_target for update;
  if target.id is null then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if p_actor=p_target and (not p_active or p_role <> 'owner') then
    raise exception 'SELF_OWNER_CHANGE';
  end if;
  if p_action in ('ACCOUNT_LOCKED','ACCOUNT_UNLOCKED') then
    p_name := target.full_name;
    p_role := target.role;
    p_permissions := target.permissions;
  end if;
  update public.profiles set full_name=p_name,role=p_role,is_active=p_active,permissions=p_permissions where id=p_target;
  insert into public.account_audit_logs(action,actor_id,actor_name,target_id,target_name,target_role,details)
  values(p_action,p_actor,left(actor.full_name,120),p_target,left(p_name,120),p_role,left(p_details,1000));
end;
$$;

create or replace function public.set_center_data_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

create or replace function public.commit_center_data(
  p_actor uuid, p_role public.app_role, p_permissions jsonb,
  p_version timestamptz, p_payload jsonb, p_request_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor public.profiles; current_row public.center_data;
begin
  -- Shared with profile administration, so a revoked role cannot finish a
  -- mutation authorized under its former permissions.
  perform pg_advisory_xact_lock(701107007);
  select * into actor from public.profiles where id=p_actor;
  if actor.id is null or not actor.is_active or actor.role <> p_role or actor.permissions is distinct from p_permissions then
    raise exception 'CENTER_FORBIDDEN';
  end if;
  select * into current_row from public.center_data where id='primary' for update;
  if current_row.last_request_id=p_request_id and current_row.last_request_actor=p_actor then
    return jsonb_build_object('payload',current_row.payload,'updated_at',current_row.updated_at);
  end if;
  if current_row.updated_at is distinct from p_version then raise exception 'CENTER_CONFLICT'; end if;
  insert into public.center_data(id,payload,updated_by,last_request_id,last_request_actor)
  values('primary',p_payload,p_actor,p_request_id,p_actor)
  on conflict(id) do update set payload=excluded.payload,updated_by=p_actor,last_request_id=p_request_id,last_request_actor=p_actor
  returning * into current_row;
  return jsonb_build_object('payload',current_row.payload,'updated_at',current_row.updated_at);
end;
$$;

create or replace function public.app_security_version()
returns integer language sql stable security definer set search_path = '' as $$
  select case when not has_table_privilege('authenticated','public.center_data','SELECT')
    and not has_table_privilege('authenticated','public.center_data','UPDATE')
    and not has_table_privilege('anon','public.center_data','SELECT')
    and exists(select 1 from pg_trigger where tgrelid='public.profiles'::regclass and tgname='profiles_protect_last_owner' and tgenabled <> 'D')
    then 7 else 0 end;
$$;

revoke all on function public.protect_last_owner() from public, anon, authenticated;
revoke all on function public.set_center_data_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.admin_update_profile_secure(uuid,uuid,text,public.app_role,boolean,jsonb,text,text) from public, anon, authenticated;
revoke all on function public.commit_center_data(uuid,public.app_role,jsonb,timestamptz,jsonb,uuid) from public, anon, authenticated;
revoke all on function public.app_security_version() from public, anon, authenticated;
grant execute on function public.admin_update_profile_secure(uuid,uuid,text,public.app_role,boolean,jsonb,text,text) to service_role;
grant execute on function public.commit_center_data(uuid,public.app_role,jsonb,timestamptz,jsonb,uuid) to service_role;
grant execute on function public.app_security_version() to service_role;

-- Repair codes produced by the former length+1 generator. Keep immutable IDs,
-- enrollment and receipts linked, and record each changed code for lookup.
do $repair$
declare
  doc jsonb; student jsonb; extras jsonb; fixed_students jsonb := '[]'::jsonb;
  fixes jsonb := '[]'::jsonb; seen text[] := '{}'; code text; replacement text;
  next_number bigint; changed boolean := false;
begin
  select payload into doc from public.center_data where id='primary' for update;
  if doc is null then return; end if;
  select coalesce(max(substring(s->>'code' from 3)::bigint),0)+1 into next_number
  from jsonb_array_elements(coalesce(doc->'students','[]'::jsonb)) s
  where s->>'code' ~* '^HS[0-9]{1,12}$';
  for student in select value from jsonb_array_elements(coalesce(doc->'students','[]'::jsonb)) loop
    select coalesce(jsonb_agg(class_id order by class_id),'[]'::jsonb) into extras from (
      select distinct class_id from (
        select jsonb_array_elements_text(coalesce(student->'extraClassIds','[]'::jsonb)) as class_id
        union all
        select c->>'id' from jsonb_array_elements(coalesce(doc->'classes','[]'::jsonb)) c
        where coalesce(c->'studentIds','[]'::jsonb) ? (student->>'id')
      ) memberships where class_id<>coalesce(student->>'classId','') and class_id<>''
    ) unique_memberships;
    if extras is distinct from coalesce(student->'extraClassIds','[]'::jsonb) then
      student := jsonb_set(student,'{extraClassIds}',extras);
      changed := true;
    end if;
    code := upper(trim(student->>'code'));
    if code=any(seen) then
      replacement := 'HS' || lpad(next_number::text,greatest(3,length(next_number::text)),'0');
      next_number := next_number+1;
      student := jsonb_set(student,'{code}',to_jsonb(replacement));
      fixes := fixes || jsonb_build_array(jsonb_build_object(
        'id','AUDIT_CODE_REPAIR_' || (student->>'id'),
        'timestamp',to_char(now() at time zone 'Asia/Ho_Chi_Minh','HH24:MI:SS DD/MM/YYYY'),
        'userEmail','','userName','Hệ thống','action','SỬA','module','Học sinh',
        'details','Sửa mã trùng ' || code || ' thành ' || replacement || '. ID hồ sơ: ' || (student->>'id')));
      changed := true;
      code := replacement;
    end if;
    seen := array_append(seen,code);
    fixed_students := fixed_students || jsonb_build_array(student);
  end loop;
  if changed then
    doc := jsonb_set(doc,'{students}',fixed_students);
    doc := jsonb_set(doc,'{activityLogs}',fixes || coalesce(doc->'activityLogs','[]'::jsonb));
    update public.center_data set payload=doc where id='primary';
  end if;
end;
$repair$;
commit;
