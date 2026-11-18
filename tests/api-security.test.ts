import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import vm from "node:vm";
import { canonicalCenter } from "../server/centerPolicy";
import { initialSettings } from "../src/mock/initialData";
import { EMPTY_PERMISSIONS } from "../src/lib/access";
import type { CenterBackupData } from "../src/types";

const id = "00000000-0000-4000-8000-000000000001";
const profile = {
  id,
  full_name: "Synthetic Owner",
  role: "owner",
  is_active: true,
  permissions: structuredClone(EMPTY_PERMISSIONS),
};
const payload = canonicalCenter({
  settings: initialSettings,
} as CenterBackupData);
let identity = true,
  securityVersion = 7,
  commits = 0,
  profileUpdates = 0;
const client = {
  auth: {
    getUser: async () => ({
      data: { user: identity ? { id, user_metadata: {} } : null },
      error: null,
    }),
  },
  from(table: string) {
    const query = {
      select() {
        return query;
      },
      eq() {
        return query;
      },
      maybeSingle: async () => ({
        data: table === "profiles" ? profile : { payload, updated_at: "v1" },
        error: null,
      }),
    };
    return query;
  },
  rpc: async (name: string) => {
    if (name === "app_security_version")
      return { data: securityVersion, error: null };
    if (name === "commit_center_data") {
      commits++;
      return { data: { payload, updated_at: "v2" }, error: null };
    }
    profileUpdates++;
    return { data: null, error: { message: "LAST_ACTIVE_OWNER" } };
  },
};
async function load(path: string) {
  const output = await build({
    entryPoints: [path],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    plugins: [
      {
        name: "fake-supabase",
        setup(builder) {
          builder.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({
            path: "fake-client",
            namespace: "test",
          }));
          builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({
            contents: "export const createClient=()=>globalThis.__client;",
            loader: "js",
          }));
        },
      },
    ],
  });
  const context = vm.createContext({
    module: { exports: {} },
    exports: {},
    require: createRequire(import.meta.url),
    Buffer,
    console,
    process: {
      env: {
        SUPABASE_URL: "https://test.supabase.co",
        SUPABASE_SECRET_KEY: "synthetic-test-secret",
        APP_URL: "https://test.example",
      },
    },
    __client: client,
    structuredClone,
    Date,
    Map,
    Set,
  });
  new vm.Script(output.outputFiles[0].text).runInContext(context);
  return context.module.exports.default;
}
async function call(
  handler: any,
  method: string,
  body?: unknown,
  token = true,
) {
  const res = {
    statusCode: 0,
    body: null as any,
    setHeader() {},
    status(status: number) {
      this.statusCode = status;
      return this;
    },
    json(value: unknown) {
      this.body = value;
      return this;
    },
  };
  await handler(
    {
      method,
      headers: {
        host: "test.example",
        origin: "https://test.example",
        ...(token ? { authorization: "Bearer test" } : {}),
      },
      body,
    },
    res,
  );
  return res;
}
const center = await load("api/center-data.ts");
assert.equal((await call(center, "GET", undefined, false)).statusCode, 401);
identity = false;
assert.equal((await call(center, "GET")).statusCode, 401);
identity = true;
securityVersion = 0;
assert.equal((await call(center, "GET")).statusCode, 503);
securityVersion = 7;
profile.role = "staff";
assert.equal((await call(center, "GET")).statusCode, 200);
const denied = await call(center, "PATCH", {
  version: "v1",
  requestId: crypto.randomUUID(),
  changes: { settings: { ...initialSettings, name: "Forbidden" } },
});
assert.equal(denied.statusCode, 403);
assert.equal(commits, 0);
profile.role = "owner";
assert.equal(
  (
    await call(center, "PATCH", {
      version: "stale",
      requestId: crypto.randomUUID(),
      changes: {},
    })
  ).statusCode,
  409,
);
assert.equal(commits, 0);
assert.equal(
  (
    await call(center, "PATCH", {
      version: "v1",
      requestId: crypto.randomUUID(),
      changes: { settings: { ...initialSettings, name: "Authorized" } },
    })
  ).statusCode,
  200,
);
assert.equal(commits, 1);

const accounts = await load("api/admin/users.ts");
assert.equal(
  (
    await call(accounts, "POST", {
      email: "test@example.test",
      fullName: "Synthetic Owner",
      role: "staff",
    })
  ).statusCode,
  400,
);
assert.equal(profileUpdates, 0);
assert.equal(
  (
    await call(accounts, "POST", {
      email: "test@example.test",
      fullName: "Synthetic Owner",
      role: "owner",
    })
  ).statusCode,
  403,
);
assert.equal(profileUpdates, 1);
console.log(
  "Passed: actual API handlers reject missing authentication, missing migration, unauthorized writes, stale versions, self-demotion, and database account guards.",
);
