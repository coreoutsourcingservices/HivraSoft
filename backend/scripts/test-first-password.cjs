require("tsx/cjs");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
const User = require("../src/models/User.model.ts").default;
const Audit = require("../src/models/AdminAuditLog.model.ts").default;
const { hashPassword, verifyPassword } = require("../src/utils/password.ts");
const { newPassword } = require("../src/routes/staff-auth.routes.ts");
const { authenticateStaff } = require("../src/services/staff-session.service.ts");
async function main() {
  assert.equal(newPassword("Abcd1234", "Abcd1234"), "Abcd1234");
  for (const value of ["Abc1234", "abcdefgh", "12345678"]) assert.throws(()=>newPassword(value,value));
  assert.throws(()=>newPassword("Abcd1234","Abcd1235"));
  const temporary = "Temporary1234";
  let user = { _id: "507f1f77bcf86cd799439011", name: "Test Admin", email: "test@example.com", username: "testadmin", role: "admin", isActive: true, accountStatus: "active", sessionVersion: 0, mustChangePassword: true, temporaryPasswordExpiresAt: new Date(Date.now()+86400000), passwordHash: await hashPassword(temporary), save: async()=>{} };
  User.findOne = () => ({ select: async()=>user });
  User.findById = () => ({ select: async()=>user });
  User.findOneAndUpdate = (_, update) => ({ select: async()=>{Object.assign(user,update.$set);user.sessionVersion++;return user;} });
  Audit.create = async()=>({});
  const app = express();
  app.use(express.json(),cookieParser());
  app.use("/api/admin",require("../src/routes/staff-auth.routes.ts").default);
  app.get("/api/admin/protected",authenticateStaff,(_,res)=>res.json({success:true}));
  app.use((error,req,res,next)=>res.status(error.status||500).json({message:error.message}));
  const server=app.listen(0,"127.0.0.1");await new Promise(resolve=>server.once("listening",resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/admin`;
  const post=(path,body,cookie)=>fetch(`${base}/${path}`,{method:"POST",headers:{"Content-Type":"application/json",...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
  try {
    const login=await post("login",{username:user.username,password:temporary});
    assert.equal(login.status,200);assert.equal((await login.json()).mustChangePassword,true);
    const adminCookie=login.headers.get("set-cookie").split(";")[0];
    // Reproduce the real browser: a legacy superadmin cookie accompanies admin login.
    const superCookie=`superadminToken=${jwt.sign({id:"507f1f77bcf86cd799439012",role:"super_admin"},process.env.JWT_SECRET)}`;
    const cookie=`${adminCookie}; ${superCookie}`;
    assert.equal((await fetch(`${base}/me`,{headers:{Cookie:superCookie}})).status,401,"admin API must not borrow the superadmin session");
    assert.equal((await fetch(`${base}/me`,{headers:{Cookie:cookie}})).status,200,"admin session works with both cookies present");
    assert.equal((await fetch(`${base}/protected`,{headers:{Cookie:cookie}})).status,403);
    assert.equal((await post("change-password",{oldPassword:temporary,newPassword:"abcdefgh",confirmPassword:"abcdefgh"},cookie)).status,400);
    const changed=await post("change-password",{oldPassword:temporary,newPassword:"Abcd1234",confirmPassword:"Abcd1234"},cookie);
    assert.equal(changed.status,200);assert.equal(user.mustChangePassword,false);
    assert.match(changed.headers.get("set-cookie"), /^accessToken=/, "admin cookie is refreshed even with superadmin cookie present");
    assert(!changed.headers.get("set-cookie").includes("superadminToken="), "superadmin cookie is not overwritten");
    assert(await verifyPassword("Abcd1234",user.passwordHash));assert(!await verifyPassword(temporary,user.passwordHash));
    const fresh=changed.headers.get("set-cookie").split(";")[0];
    assert.equal((await fetch(`${base}/protected`,{headers:{Cookie:fresh}})).status,200);
    assert.equal((await fetch(`${base}/protected`,{headers:{Cookie:cookie}})).status,401);
    console.log("Passed: 8-character letter/number policy, first-login password gate, password update, dashboard access and old-session revocation.");
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
