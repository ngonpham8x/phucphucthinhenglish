import assert from "node:assert/strict";
import {
  CenterSyncQueue,
  CenterSyncConflict,
  centerRequest,
} from "../src/lib/centerSync";
import { canonicalCenter } from "../server/centerPolicy";
import { initialSettings } from "../src/mock/initialData";
import type { CenterPayload } from "../src/lib/centerChanges";

const payload = canonicalCenter({ settings: initialSettings } as CenterPayload);
const edited = (name: string) => ({
  ...payload,
  settings: { ...initialSettings, name },
});
let release: () => void;
const gate = new Promise<void>((resolve) => {
  release = resolve;
});
const requests: any[] = [];
const queue = new CenterSyncQueue({ payload, version: "v1" }, async (body) => {
  requests.push(body);
  if (requests.length === 1) await gate;
  return { payload, version: `v${requests.length + 1}` };
});
queue.update(edited("First edit"));
assert.equal(queue.dirty, true);
const saving = queue.flush();
queue.update(edited("Edit while saving"));
assert.equal(queue.flush(), saving);
release!();
await saving;
assert.equal(requests.length, 2);
assert.equal(requests[1].version, "v2");
assert.equal(requests[1].changes.settings.name, "Edit while saving");
assert.equal(queue.dirty, false);

let fail = true;
const retryRequests: any[] = [];
const retry = new CenterSyncQueue({ payload, version: "v1" }, async (body) => {
  retryRequests.push(body);
  if (fail) throw new Error("Network disconnected");
  return { payload, version: "v2" };
});
retry.update(edited("Saved before logout"));
await assert.rejects(retry.flush(), /Network/);
assert.equal(retry.dirty, true);
assert.equal(retry.saving, false);
fail = false;
await retry.flush();
assert.deepEqual(retryRequests[1], retryRequests[0]);
assert.equal(retry.dirty, false);

const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Concurrent update" }), {
      status: 409,
    });
  await assert.rejects(
    centerRequest("test-token", {
      changes: {},
      version: "v1",
      requestId: crypto.randomUUID(),
    }),
    CenterSyncConflict,
  );
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Permission revoked" }), {
      status: 403,
    });
  await assert.rejects(centerRequest("test-token"), /Permission revoked/);
} finally {
  globalThis.fetch = originalFetch;
}
console.log(
  "Passed: sync drains concurrent local edits, retries idempotently, retains failed changes, rejects stale/unauthorized API responses.",
);
