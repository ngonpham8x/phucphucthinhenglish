# Production and security checklist

The application now uses Supabase Auth with Google OAuth for identity. The browser only receives a Supabase publishable key; the key that provisions Google accounts is used exclusively by `api/admin/users.ts` on Vercel.

## 1. Create and configure Supabase

1. Create a Supabase project and run [`supabase/migrations/001_auth_profiles.sql`](supabase/migrations/001_auth_profiles.sql) in **SQL Editor**.
2. In **Authentication → Providers**, enable Google. Create Google OAuth credentials in Google Cloud and copy the client ID and secret to the Google provider configuration.
3. In **Authentication → URL configuration**, set Site URL to the final HTTPS Vercel URL and add both the final URL and any preview URL that will be used to the Redirect URLs allow-list.
4. Disable public sign-ups. Accounts are provisioned only by an active owner through the protected server endpoint and can then sign in with the matching Google email.
5. Run `001_auth_profiles.sql`, `002_bootstrap_owners.sql`, `003_center_data.sql`, and `004_account_audit_logs.sql`. Add initial-owner emails directly to the private Supabase allowlist table; do not commit them to GitHub. Future owners are provisioned by an existing owner in the app; no public endpoint can create arbitrary owners. See `SUPABASE_SETUP.md` for the precise Dashboard flow.

## 2. Vercel environment variables

Set the following separately for Production and Preview where relevant. Values prefixed `VITE_` are public browser configuration; all other values are server-only secrets.

| Variable | Where used |
| --- | --- |
| `VITE_SUPABASE_URL` | Browser and build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser and build |
| `SUPABASE_URL` | Protected Vercel API |
| `SUPABASE_SECRET_KEY` | Protected Vercel API only. Never use a `VITE_` prefix. |
| `APP_URL` | Exact production HTTPS URL accepted as a protected API origin |
| `ALLOWED_ORIGINS` | Optional comma-separated production/preview URL allow-list |

Use `SUPABASE_SERVICE_ROLE_KEY` only for legacy Supabase projects that do not provide `SUPABASE_SECRET_KEY`.

## 3. What is protected

- Google OAuth sessions are checked against the active `profiles` record before the app renders.
- Accounts not explicitly provisioned by a centre owner are inactive and cannot enter the app, including a Google user who knows the URL.
- Creating, listing, and locking users requires a live Supabase JWT and an active `owner` profile; this is checked again on the Vercel server, not only in the UI.
- The API validates input, restricts allowed browser origins, does not cache responses, applies a small provisioning rate limit, and prevents locking the final active owner.
- RLS permits the browser to read only its own active profile. Browser clients cannot grant roles, activate profiles, or provision Google accounts.
- Account provisioning, role changes, and lock/unlock operations write to a separate RLS-protected audit table. Only the protected server endpoint can write it and only active owners can read it through the API.
- Vercel headers add CSP, clickjacking, MIME-sniffing, referrer, and device-permission protections.

No internet-facing application can be guaranteed to be “unhackable”. Keep dependencies updated, require a password manager and MFA for owner Google accounts, review Supabase/Vercel audit logs, and rotate the server secret immediately if it is ever exposed.

## Important data limitation

The management modules (students, classes, tuition, backups, etc.) in this imported starter still persist their demonstration state in the browser's `localStorage`. Authentication and account management are real, but **this is not yet suitable for entering real student or financial data**: local browser storage is neither shared between staff nor an adequate protected database.

Before operational use, move each business entity to Supabase tables with its own RLS policies and perform writes through authenticated server endpoints. Do not paste real student data into the current demo storage.
