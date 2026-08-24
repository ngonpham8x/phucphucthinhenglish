-- Immutable account-management audit trail. Only the Vercel server (using a
-- Supabase secret key) writes entries; browser clients have no table access.

create table if not exists public.account_audit_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default timezone('utc', now()),
  action text not null check (action in (
    'ACCOUNT_PROVISIONED',
    'ACCOUNT_UPDATED',
    'ACCOUNT_LOCKED',
    'ACCOUNT_UNLOCKED'
  )),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '' check (char_length(actor_name) <= 120),
  target_id uuid references auth.users(id) on delete set null,
  target_name text not null default '' check (char_length(target_name) <= 120),
  target_role public.app_role,
  details text not null default '' check (char_length(details) <= 1000)
);

create index if not exists account_audit_logs_occurred_at_idx
  on public.account_audit_logs (occurred_at desc);

alter table public.account_audit_logs enable row level security;
revoke all on table public.account_audit_logs from anon, authenticated;
