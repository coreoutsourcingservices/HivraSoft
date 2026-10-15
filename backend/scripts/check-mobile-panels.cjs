require("dotenv").config({quiet:true});
require("tsx/cjs");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const os=require("node:os");
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const User=require("../src/models/User.model.ts").default;
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || "playwright");
const widths=process.env.CHECK_WIDTHS ? process.env.CHECK_WIDTHS.split(",").map(Number) : [320,375,768,1024,1440,1920,3840];
const output=process.env.RESPONSIVE_OUTPUT || path.join(os.tmpdir(),"hivrasoft-responsive-20261015");
async function main(){
  await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000,socketTimeoutMS:12000});
  const [admin,superadmin]=await Promise.all(["admin","super_admin"].map(role=>User.findOne({role,isActive:true,accountStatus:"active",mustChangePassword:{$ne:true},$or:[{adminStatus:"approved"},{adminStatus:{$exists:false}}]}).select("+sessionVersion").lean()));
  await mongoose.disconnect();
  assert(admin&&superadmin,"Active admin and superadmin accounts with completed password setup are required for read-only authenticated UI checks");
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL || "msedge",headless:true});
  const results=process.env.CHECK_PORTALS && fs.existsSync(path.join(output,"results.json")) ? JSON.parse(fs.readFileSync(path.join(output,"results.json"),"utf8")) : [];
  try{
    for(const portal of (process.env.CHECK_PORTALS || "login,frontend,admin,superadmin").split(",")){
      const context=await browser.newContext({reducedMotion:"reduce"});
      if(portal==="admin"||portal==="superadmin"){
        const user=portal==="admin"?admin:superadmin;
        await context.addCookies([{name:portal==="admin"?"adminToken":"superadminToken",value:jwt.sign({id:String(user._id),role:user.role,purpose:portal+"_session",sessionVersion:user.sessionVersion||0},process.env.JWT_SECRET,{expiresIn:"20m",audience:portal}),domain:"localhost",path:"/"}]);
      }
      const page=await context.newPage();
      const errors=[];page.on("pageerror",error=>errors.push(error.message));
      page.on("response",response=>{if(["admin","superadmin"].includes(portal)&&new URL(response.url()).pathname.startsWith("/api/")&&[401,403].includes(response.status()))errors.push(`${response.status()} ${new URL(response.url()).pathname}`);});
      const base=portal==="frontend"?"http://localhost:3000":"http://localhost:3001";
      const routes=portal==="frontend"?["/","/women","/cart"]:portal==="login"?["/","/superadmin"]:portal==="admin"?["/","/products","/orders"]:["/superadmin","/superadmin/audit-logs"];
      for(const route of routes){
        let response;
        for(const width of widths){
          const height=width>=3840?2160:width>=1920?1080:900;
          await page.setViewportSize({width,height});
          if(width===widths[0]) response=await page.goto(base+route,{waitUntil:"networkidle",timeout:120000});
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
          assert(response&&response.status()<400,portal+" "+route+" returned "+response?.status());
          if(portal==="frontend"){
            await page.locator("header").first().waitFor({state:"visible",timeout:60000});
            await page.getByText("Loading Experience",{exact:true}).waitFor({state:"hidden",timeout:60000});
            if(route==="/"){
              await page.locator("main.overflow-x-hidden").waitFor({state:"visible",timeout:60000});
              if(width===widths[0]){const close=page.getByRole("button",{name:"Close favourites popup",exact:true});
                await close.waitFor({timeout:30000});await close.click();}
            }
          }
          if(portal==="admin")await page.locator(".admin-shell").waitFor({timeout:30000});
          if(portal==="admin"&&route==="/"){
            await page.getByText("Loading orders...",{exact:true}).waitFor({state:"hidden",timeout:60000});
            assert.equal(await page.locator(".admin-dashboard").getByText(/Not authenticated|Dashboard temporarily unavailable/).count(),0,"Admin dashboard must display authenticated data");
          }
          if(portal==="superadmin")await page.getByRole("navigation",{name:"Superadmin navigation"}).waitFor({timeout:30000});
          if(portal==="login")await page.getByRole("heading",{name:route==="/"?"Admin sign in":"Superadmin sign in",exact:true}).waitFor();
          const dimensions=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,overflowing:[...document.querySelectorAll("body *")].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&getComputedStyle(el).position!=="fixed"}).slice(0,8).map(el=>({tag:el.tagName,class:el.className}))}));
          assert(dimensions.document<=dimensions.width+1,portal+" "+route+" at "+width+"px overflows: "+JSON.stringify(dimensions));
          if(portal==="admin"&&route==="/"&&width<1024){
            await page.getByRole("button",{name:"Open navigation",exact:true}).click();
            await page.waitForFunction(()=>document.body.style.overflow==="hidden");
            await page.keyboard.press("Escape");
            await page.getByRole("button",{name:"Open navigation",exact:true}).waitFor();
            await page.waitForFunction(()=>document.body.style.overflow!=="hidden");
          }
          if([320,768,3840].includes(width))await page.screenshot({path:path.join(output,portal+route.replaceAll("/","-")+"-"+width+".png"),fullPage:false,caret:"initial"});
          if(portal==="frontend"&&route==="/"&&[320,768].includes(width)){
            await page.getByRole("button",{name:"Open menu",exact:true}).click();
            const close=page.getByRole("button",{name:"Close menu",exact:true}).last();await close.waitFor({state:"visible"});
            assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Storefront menu must fit the viewport");
            await close.click();await close.waitFor({state:"hidden"});
          }
          results.push({portal,route,width,height,status:"passed"});
          console.log(portal+" "+route+": "+width+"px passed");
        }
      }
      if(portal==="admin"){
        await page.goto(base+"/superadmin");await page.getByRole("heading",{name:"Superadmin sign in",exact:true}).waitFor();
      }
      if(portal==="superadmin"){
        await page.goto(base+"/");await page.getByRole("heading",{name:"Admin sign in",exact:true}).waitFor();
        await page.goto(base+"/superadmin/products");assert.equal(new URL(page.url()).pathname,"/superadmin");
      }
      assert.equal(errors.length,0,portal+" browser errors: "+errors.join("; "));
      await context.close();
    }
    const context=await browser.newContext();const page=await context.newPage();
    await page.goto("http://localhost:3001/admin");assert.equal(new URL(page.url()).pathname,"/");
    await page.goto("http://localhost:3000/admin");assert.equal(page.url(),"http://localhost:3001/");
    console.log("Passed: isolated portal access, old bookmarks and storefront redirects.");
  }finally{const unique=[...new Map(results.map(result=>[`${result.portal}:${result.route}:${result.width}`,result])).values()];fs.writeFileSync(path.join(output,"results.json"),JSON.stringify(unique,null,2));await browser.close();}
  console.log("Screenshots and report: "+output);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
