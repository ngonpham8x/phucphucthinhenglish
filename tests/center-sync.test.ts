import assert from 'node:assert/strict';
import { saveCenterPayload, CenterSyncConflict } from '../src/lib/centerSync';
// Two browser clients use the same server snapshot. The second writer must not
// overwrite the first writer's data, and updates must return the new version.
let row: {payload: object; updated_at: string} | null = {payload: {}, updated_at: 'v1'};
const client = {from() {
 const filters: Record<string,string> = {};
 let incoming: object; let insert = false;
 const request = {
  eq(key: string,value: string) {filters[key]=value;return request;},
  select() {return request;},
  async maybeSingle() {
   if (insert && row) return {data:null,error:{code:'23505',message:'Duplicate'}};
   if (!insert && row?.updated_at !== filters.updated_at) return {data:null,error:null};
   row = {payload: incoming,updated_at: row ? row.updated_at + '+' : 'v1'};
   return {data:{updated_at: row.updated_at},error:null};
  },
 };
 return {update(value: {payload:object}) {incoming=value.payload;return request;},
 insert(value: {payload:object}) {incoming=value.payload;insert=true;return request;}};
}} as any;
const version = await saveCenterPayload(client,{receipt:'first'},'v1');
await assert.rejects(saveCenterPayload(client,{receipt:'stale'},'v1'),CenterSyncConflict);
assert.deepEqual(row?.payload,{receipt:'first'});
await assert.rejects(saveCenterPayload(client,{},null),CenterSyncConflict);
await saveCenterPayload(client,{receipt:'next'},version);
assert.deepEqual(row?.payload,{receipt:'next'});
row = null;
assert.equal(await saveCenterPayload(client,{receipt:'new'},null),'v1');
console.log('Passed: concurrent stale writes blocked, insert conflicts, version advancement.');
