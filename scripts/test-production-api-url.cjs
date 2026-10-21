const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
let sequence=0;
async function config(environment,publicUrl,serverUrl){
  process.env.NODE_ENV=environment;
  for(const [key,value] of [['NEXT_PUBLIC_API_URL',publicUrl],['API_URL',serverUrl]]){
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
  return (await import(pathToFileURL(path.resolve(__dirname,'../next.config.mjs')).href+`?api-test=${++sequence}`)).default;
}

test('Production browser requests cannot default to localhost',async()=>{
  for(const url of [undefined,'','  ','http://localhost:5000','http://127.0.0.1:5000','https://127.0.0.1:5000','http://[::1]:5000','http://0.0.0.0:5000','invalid','javascript:alert(1)','http://backend.hivrasoft.com']){
    const c=await config('production',url);
    assert.equal(c.env.NEXT_PUBLIC_API_URL,'https://hivrasoft.com',`Unsafe/missing value: ${url}`);
    assert.equal((await c.rewrites()).afterFiles[0].destination,'https://backend.hivrasoft.com/api/:path*');
  }
});

test('Production authentication uses the frontend origin and a separate backend proxy',async()=>{
  for(const url of ['https://backend.hivrasoft.com','https://backend.hivrasoft.com/','https://hivrasoft.com']){
    const c=await config('production',url);
    assert.equal(c.env.NEXT_PUBLIC_API_URL,'https://hivrasoft.com');
    assert.equal((await c.rewrites()).afterFiles[0].destination,'https://backend.hivrasoft.com/api/:path*');
  }
});

test('Configured production HTTPS API and server-only internal URLs are retained',async()=>{
  const c=await config('production',' https://hivrasoft.com/ ','http://127.0.0.1:5000/');
  assert.equal(c.env.NEXT_PUBLIC_API_URL,'https://hivrasoft.com');
  assert.equal((await c.rewrites()).afterFiles[0].destination,'http://127.0.0.1:5000/api/:path*');
});

test('Local development continues to use the local backend',async()=>{
  const c=await config('development');
  assert.equal(c.env.NEXT_PUBLIC_API_URL,'http://localhost:5000');
  const custom=await config('development','http://127.0.0.1:5001/');
  assert.equal(custom.env.NEXT_PUBLIC_API_URL,'http://127.0.0.1:5001');
});
