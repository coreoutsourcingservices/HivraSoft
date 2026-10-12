require("dotenv").config({quiet:true});
const assert=require("node:assert/strict");
require("tsx/cjs");
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const User=require("../src/models/User.model.ts").default;
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
async function main(){
  await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000,socketTimeoutMS:12000});
  const [admin,superadmin]=await Promise.all([User.findOne({role:"admin",isActive:true,mustChangePassword:false}).select("+sessionVersion").lean(),User.findOne({role:"super_admin",isActive:true}).lean()]);
  assert(admin&&superadmin,"An active admin and superadmin are required for read-only UI checks");
  await mongoose.disconnect();
  const browser=await chromium.launch({channel:"msedge",headless:true});
  try{
    const context=await browser.newContext();
    await context.addCookies([
      {name:"accessToken",value:jwt.sign({id:String(admin._id),role:"admin",purpose:"staff_session",sessionVersion:admin.sessionVersion||0},process.env.JWT_SECRET,{expiresIn:"10m"}),domain:"localhost",path:"/"},
      {name:"superadminToken",value:jwt.sign({id:String(superadmin._id),role:"super_admin"},process.env.JWT_SECRET,{expiresIn:"10m"}),domain:"localhost",path:"/"},
    ]);
    const page=await context.newPage();
    // Use a deterministic read-only dashboard fixture in the browser. Server auth remains real.
    const dashboard={success:true,generatedAt:new Date().toISOString(),stats:{products:46,orders:381,customers:374,revenue:162763.58,categories:5,banners:3,growth:{products:1,orders:2,customers:3,revenue:4}},salesOverview:[],orderStatus:{pending:200,completed:170,cancelled:11},recentOrders:[],lowStockProducts:[],status:{backend:"connected",mongodb:"connected",productsApi:"ready",categoriesApi:"ready",ordersApi:"ready",bannersApi:"ready"}};
    await page.route("**/api/admin/dashboard",route=>route.fulfill({json:dashboard}));
    for(const port of [3001,3002]){
      for(const width of [320,375,768,1440]){
        await page.setViewportSize({width,height:900});
        await page.goto(`http://localhost:${port}/admin`,{waitUntil:"domcontentloaded",timeout:120000});
        await page.locator(".admin-dashboard").waitFor({timeout:60000});
        const dimensions=await page.evaluate(()=>({width:window.innerWidth,document:document.documentElement.scrollWidth}));
        assert(dimensions.document<=dimensions.width+1,`${port} at ${width}px overflows by ${dimensions.document-dimensions.width}px`);
        if(width<1024){
          await page.getByRole("button",{name:"Open navigation",exact:true}).click();
          assert.equal(await page.evaluate(()=>document.body.style.overflow),"hidden");
          await page.keyboard.press("Escape");
          await page.getByRole("button",{name:"Open navigation",exact:true}).waitFor();
          assert.notEqual(await page.evaluate(()=>document.body.style.overflow),"hidden");
        }
        console.log(`${port}: ${width}px dashboard and navigation passed`);
      }
    }
    await page.setViewportSize({width:375,height:900});
    await page.goto(`http://localhost:3002/admin/staff/${admin._id}`,{waitUntil:"domcontentloaded",timeout:120000});
    await page.getByRole("heading",{name:admin.name,exact:true}).waitFor({timeout:60000});
    assert(await page.getByRole("heading",{name:"Admin information",exact:true}).isVisible());
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
    assert(!overflow,"Admin profile must fit mobile viewport");
    console.log("Admin profile: information and mobile layout passed");
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
