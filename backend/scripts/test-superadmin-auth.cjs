require("tsx/cjs");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const express = require("express");
const cookieParser = require("cookie-parser");
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
const User = require("../src/models/User.model.ts").default;
const Audit = require("../src/models/AdminAuditLog.model.ts").default;
const { hashPassword } = require("../src/utils/password.ts");
const { authenticateStaff, issueStaffSession } = require("../src/services/staff-session.service.ts");
async function main() {
 const password = "Superadmin1234";
 const user = { _id:"507f1f77bcf86cd799439011", name:"Test", email:"test@example.com", username:"test", role:"admin", isActive:true, accountStatus:"active", sessionVersion:0, mustChangePassword:false, temporaryPasswordExpiresAt:new Date(Date.now()+86400000), passwordHash:await hashPassword(password), save:async()=>{} };
 User.findOne = () => ({ select:async()=>user });
 User.findById = () => ({ select:async()=>user });
 User.updateOne = async()=>{user.sessionVersion++};
 Audit.create = async()=>({});
 const app = express(); app.use(express.json(),cookieParser());
 app.use("/api/admin",require("../src/routes/staff-auth.routes.ts").default);
 app.use("/api/superadmin",require("../src/routes/superadmin.routes.ts").default);
 app.get("/api/admin/protected",authenticateStaff,(_,res)=>res.json({success:true}));
 app.use("/api/admin",require("../src/routes/admin.routes.ts").default);
 app.use((error,req,res,next)=>res.status(error.status||500).json({message:error.message}));
 const server=app.listen(0,"127.0.0.1"); await new Promise(r=>server.once("listening",r));
 const base="http://127.0.0.1:"+server.address().port;
 const login=()=>fetch(base+"/api/superadmin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user.username,password})});
 const get=(path,cookie)=>fetch(base+path,{headers:{Cookie:cookie||""}});
 try {
 assert.equal((await get("/api/superadmin/me")).status,401);
 assert.equal((await login()).status,401,"ordinary admin rejected");
 user.role="super_admin";user.isActive=false;assert.equal((await login()).status,401);
 user.isActive=true;user.mustChangePassword=true;
 let response=await login();assert.equal(response.status,200);
 const cookies=response.headers.getSetCookie().map(c=>c.split(";")[0]).filter(c=>!c.endsWith("=")).join("; ");
 assert(response.headers.getSetCookie().some(c=>c.startsWith("adminToken=;")),"superadmin login clears any existing admin login in this browser");
 assert.match(cookies,/superadminToken=/);assert.doesNotMatch(cookies,/(?:^|; )(?:accessToken|adminToken)=/);
 for(const c of response.headers.getSetCookie()){assert.match(c,/HttpOnly/i);assert.match(c,/Path=\//)}
 assert.equal((await get("/api/superadmin/me",cookies)).status,200);
 assert.equal((await get("/api/admin/protected",cookies)).status,401,"superadmin cannot access commerce");
 assert.equal((await get("/api/superadmin/logs",cookies)).status,403,"temporary password blocks management");
 user.mustChangePassword=false;
 assert.equal((await get("/api/admin/protected",cookies)).status,401,"superadmin cannot use admin APIs");
 const adminLogin=()=>fetch(base+"/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user.username,password})});
 assert.equal((await adminLogin()).status,401,"superadmin rejected by admin login");
 const superToken=cookies.match(/superadminToken=([^;]+)/)[1];
 assert.equal((await get("/api/admin/protected","adminToken="+superToken)).status,401,"cookie renaming cannot bypass audience");
 assert.equal((await fetch(base+"/api/admin/protected",{headers:{Authorization:"Bearer "+superToken}})).status,401,"Bearer cannot bypass audience");
 assert.throws(()=>issueStaffSession({cookie(){}},user,false));
 const legacySuper=jwt.sign({id:String(user._id),role:"super_admin",purpose:"staff_session"},process.env.JWT_SECRET);
 for(const path of ["/api/admin/dashboard","/api/admin/orders","/api/admin/trash"]){
   assert.equal((await get(path,"accessToken="+legacySuper)).status,401,"legacy shared superadmin token rejected by actual admin routes");
   assert.equal((await fetch(base+path,{headers:{Authorization:"Bearer "+superToken}})).status,401,"superadmin bearer rejected by actual admin routes");
 }
 user.role="admin";
 const adminResponse=await adminLogin();assert.equal(adminResponse.status,200);
 const adminCookie=adminResponse.headers.getSetCookie().map(c=>c.split(";")[0]).filter(c=>!c.endsWith("=")).join("; ");
 assert(adminResponse.headers.getSetCookie().some(c=>c.startsWith("superadminToken=;")),"admin login clears any existing superadmin login in this browser");
 assert.match(adminCookie,/^adminToken=/);assert.doesNotMatch(adminCookie,/superadminToken=|accessToken=/);
 assert.equal((await get("/api/admin/protected",adminCookie)).status,200);
 assert.equal((await get("/api/admin/global-search?q=a",adminCookie)).status,200,"actual admin route accepts new admin session");
 const legacyAdmin=jwt.sign({id:String(user._id),role:"admin",purpose:"staff_session"},process.env.JWT_SECRET);
 assert.equal((await get("/api/admin/global-search?q=a","accessToken="+legacyAdmin)).status,401,"legacy admin token must be replaced with a new login");
 assert.equal((await get("/api/superadmin/me",adminCookie)).status,401);
 assert.equal((await get("/api/superadmin/me",adminCookie.replace("adminToken=","superadminToken="))).status,401);
 user.role="super_admin";
 const me=await get("/api/superadmin/me",cookies);assert.equal((await me.json()).user.role,"super_admin");
 user.role="admin";assert.equal((await get("/api/superadmin/me",cookies)).status,401);user.role="super_admin";
 response=await fetch(base+"/api/superadmin/logout",{method:"POST",headers:{Cookie:cookies}});assert.equal(response.status,200);
 assert.equal((await get("/api/superadmin/me",cookies)).status,401);
 assert.equal((await get("/api/admin/protected",cookies)).status,401);
 console.log("Passed: superadmin role checks, isolated cookies and audiences, temporary password gate, logout and session revocation.");
 } finally {server.closeAllConnections();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1});
