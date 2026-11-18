import assert from 'node:assert/strict';
process.env.SUPABASE_URL='https://test.supabase.co';
process.env.SUPABASE_SECRET_KEY='synthetic-test-secret';
const {default:handler}=await import('../.review/server-runtime/api/center-data.js');
const res={statusCode:0,body:null,setHeader(){},status(value){this.statusCode=value;return this;},json(value){this.body=value;}};
await handler({method:'GET',headers:{}},res);
assert.equal(res.statusCode,401);
assert.match(res.body.error,/xác thực/);
console.log('Passed: emitted Node ESM API loads with real dependencies and returns the authentication guard.');
