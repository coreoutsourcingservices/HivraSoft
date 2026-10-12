require("tsx/cjs");
const assert=require("node:assert/strict");
const {proxyDashboard}=require("../lib/dashboard-proxy.ts");
async function main(){
  const original=global.fetch;
  const request=new Request("http://localhost:3001/api/admin/dashboard",{headers:{Cookie:"accessToken=test"}});
  try{
    let calls=0;
    global.fetch=async(url,options)=>{assert.equal(new URL(url).pathname,"/api/admin/dashboard");assert.equal(options.headers.get("cookie"),"accessToken=test");if(++calls===1)throw new Error("read ECONNRESET");return Response.json({success:true});};
    assert.equal((await proxyDashboard(request,"http://backend.test")).status,200);assert.equal(calls,2);
    calls=0;global.fetch=async()=>{calls++;throw new Error("read ECONNRESET");};
    const failed=await proxyDashboard(request,"http://backend.test");assert.equal(failed.status,503);assert.equal((await failed.json()).success,false);assert.equal(calls,2);
    calls=0;global.fetch=async()=>{calls++;return Response.json({message:"Unauthorized"},{status:401});};
    assert.equal((await proxyDashboard(request,"http://backend.test")).status,401);assert.equal(calls,1,"Do not retry authentication failures");
    calls=0;global.fetch=async()=>{calls++;return calls===1?new Response(new ReadableStream({start(controller){controller.error(new Error("read ECONNRESET"));}})):Response.json({success:true});};
    assert.equal((await proxyDashboard(request,"http://backend.test")).status,200);assert.equal(calls,2,"Retry reset while reading response body");
    console.log("Passed: connection/body reset retries, bounded outage response, cookie forwarding and unchanged authentication failures.");
  }finally{global.fetch=original;}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
