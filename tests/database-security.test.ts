import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql as 'select null::uuid';`);
for (const file of [
  "001_auth_profiles.sql",
  "003_center_data.sql",
  "004_account_audit_logs.sql",
]) {
  await db.exec(
    await readFile(
      new URL(`../supabase/migrations/${file}`, import.meta.url),
      "utf8",
    ),
  );
}
await db.query(
  "insert into public.center_data(id,payload) values('primary',$1)",
  [
    {
      students: [
        { id: "s1", code: "HS001" },
        { id: "s2", code: "HS001" },
        { id: "s3", code: "HS004" },
      ],
      receipts: [{ id: "r1", studentId: "s2" }],
    },
  ],
);
const migration = await readFile(
  new URL(
    "../supabase/migrations/007_server_data_permissions.sql",
    import.meta.url,
  ),
  "utf8",
);
await db.exec(migration);
const scalar = async (sql: string, params: unknown[] = []) =>
  Object.values((await db.query(sql, params)).rows[0] as object)[0];
const repaired: any = await scalar(
  "select payload from public.center_data where id='primary'",
);
assert.equal(repaired.students[1].code, "HS005");
assert.equal(repaired.receipts[0].studentId, "s2");
assert.match(repaired.activityLogs[0].details, /HS001.*HS005/);
await db.exec(migration);
assert.deepEqual(
  await scalar("select payload from public.center_data where id='primary'"),
  repaired,
);
await db.exec("delete from public.center_data");
assert.equal(await scalar("select public.app_security_version()"), 7);
for (const role of ["anon", "authenticated"]) {
  assert.equal(
    await scalar(
      `select has_table_privilege('${role}','public.center_data','SELECT')`,
    ),
    false,
  );
  assert.equal(
    await scalar(
      `select has_table_privilege('${role}','public.center_data','UPDATE')`,
    ),
    false,
  );
  assert.equal(
    await scalar(
      `select has_function_privilege('${role}','public.commit_center_data(uuid,public.app_role,jsonb,timestamptz,jsonb,uuid)','EXECUTE')`,
    ),
    false,
  );
}
const a = "00000000-0000-4000-8000-000000000001",
  b = "00000000-0000-4000-8000-000000000002";
await db.query(
  "insert into auth.users(id,email) values($1,'owner@example.test'),($2,'other@example.test')",
  [a, b],
);
await db.query(
  "update public.profiles set role='owner',is_active=true where id=$1",
  [a],
);
await assert.rejects(
  db.query("update public.profiles set role='staff' where id=$1", [a]),
  /LAST_ACTIVE_OWNER/,
);
await assert.rejects(
  db.query("delete from public.profiles where id=$1", [a]),
  /LAST_ACTIVE_OWNER/,
);
const change = (
  actor: string,
  target: string,
  role: string,
  active: boolean,
  action = "ACCOUNT_UPDATED",
) =>
  db.query(
    "select public.admin_update_profile_secure($1,$2,$3,$4,$5,$6,$7,$8)",
    [actor, target, "Synthetic Test", role, active, {}, action, "Test audit"],
  );
await assert.rejects(change(a, a, "staff", true), /SELF_OWNER_CHANGE/);
await change(a, b, "owner", true);
assert.equal(
  await scalar("select count(*)::int from public.account_audit_logs"),
  1,
);
await assert.rejects(change(a, b, "staff", true, "INVALID_ACTION"));
assert.equal(
  await scalar("select role from public.profiles where id=$1", [b]),
  "owner",
);
assert.equal(
  await scalar("select count(*)::int from public.account_audit_logs"),
  1,
);
await change(a, b, "staff", true);
await assert.rejects(change(b, a, "staff", true), /CENTER_FORBIDDEN/);
const commit = (
  version: unknown,
  id: string,
  payload: unknown,
  permissions: unknown = {},
) =>
  scalar("select public.commit_center_data($1,$2,$3,$4,$5,$6)", [
    a,
    "owner",
    permissions,
    version,
    payload,
    id,
  ]) as Promise<any>;
const request = "00000000-0000-4000-8000-000000000003";
const first = await commit(null, request, { students: [] });
const retry = await commit(null, request, { students: ["must not overwrite"] });
assert.deepEqual(retry, first);
await assert.rejects(
  commit(null, "00000000-0000-4000-8000-000000000004", {}),
  /CENTER_CONFLICT/,
);
await db.query("update public.profiles set permissions=$1 where id=$2", [
  { changed: true },
  a,
]);
await assert.rejects(
  commit(first.updated_at, "00000000-0000-4000-8000-000000000005", {}),
  /CENTER_FORBIDDEN/,
);
await db.close();
console.log(
  "Passed: PostgreSQL migration, browser grants revoked, last-owner protection, atomic profile/audit rollback, CAS and idempotent writes, permission revocation.",
);
