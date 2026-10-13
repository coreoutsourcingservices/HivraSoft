require("tsx/cjs");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
const User = require("../src/models/User.model.ts").default;
const Audit = require("../src/models/AdminAuditLog.model.ts").default;
const { hashPassword } = require("../src/utils/password.ts");
const { authenticateStaff } = require("../src/services/staff-session.service.ts");
async function main() {
 const password = "Superadmin1234";
 const user = { _id:"507f1f77bcf86cd799439011", name:"Test", email:"test@example.com", username:"test", role:"admin", isActive:true, accountStatus:"active", sessionVersion:0, mustChangePassword:false, temporaryPasswordExpiresAt:new Date(Date.now()+86400000), passwordHash:await hashPassword(password), save:async()=>{} };
 User.findOne = () => ({ select:async()=>user });
 User.findById = () => ({ select:async()=>user });
 User.updateOne = async()=>{user.sessionVersion++};
 Audit.create = async()=>({});
 const app = express(); app.use(express.json(),cookieParser());
 app.use("/api/superadmin",require("../src/routes/superadmin.routes.ts").default);
 app.get("/api/admin/protected",authenticateStaff,(_,res)=>res.json({success:true}));
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
 const cookies=response.headers.getSetCookie().map(c=>c.split(";")[0]).join("; ");
 assert.match(cookies,/superadminToken=/);assert.match(cookies,/accessToken=/);
 for(const c of response.headers.getSetCookie()){assert.match(c,/HttpOnly/i);assert.match(c,/Path=\//)}
 assert.equal((await get("/api/superadmin/me",cookies)).status,200);
 assert.equal((await get("/api/admin/protected",cookies)).status,403,"temporary password blocks commerce");
 assert.equal((await get("/api/superadmin/logs",cookies)).status,403,"temporary password blocks management");
 user.mustChangePassword=false;
 assert.equal((await get("/api/admin/protected",cookies)).status,200,"superadmin can use shared commerce APIs");
 const me=await get("/api/superadmin/me",cookies);assert.equal((await me.json()).user.role,"super_admin");
 user.role="admin";assert.equal((await get("/api/superadmin/me",cookies)).status,403);user.role="super_admin";
 response=await fetch(base+"/api/superadmin/logout",{method:"POST",headers:{Cookie:cookies}});assert.equal(response.status,200);
 assert.equal((await get("/api/superadmin/me",cookies)).status,401);
 assert.equal((await get("/api/admin/protected",cookies)).status,401);
 console.log("Passed: superadmin role checks, shared commerce session, temporary password gate, logout and session revocation.");
 } finally {server.closeAllConnections();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1});
