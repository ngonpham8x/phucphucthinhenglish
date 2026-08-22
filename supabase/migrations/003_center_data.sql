-- One encrypted-in-transit, RLS-protected data document for this single-center app.
-- Do not put student, parent, or tuition data in a Git migration/seed file.

create table public.center_data (
  id text primary key default 'primary' check (id = 'primary'),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.center_data enable row level security;

create or replace function public.is_active_center_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

create policy "active users can read center data"
  on public.center_data
  for select
  to authenticated
  using (public.is_active_center_user());

create policy "active users can create center data"
  on public.center_data
  for insert
  to authenticated
  with check (public.is_active_center_user());

create policy "active users can update center data"
  on public.center_data
  for update
  to authenticated
  using (public.is_active_center_user())
  with check (public.is_active_center_user());

create or replace function public.set_center_data_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  new.updated_by = auth.uid();
  return new;
end;
$$;

create trigger center_data_set_updated_at
  before insert or update on public.center_data
  for each row execute procedure public.set_center_data_updated_at();
