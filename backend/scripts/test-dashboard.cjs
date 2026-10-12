require("tsx/cjs");
const assert=require("node:assert/strict");
const {MongoMemoryServer}=require("mongodb-memory-server");
const mongoose=require("mongoose");
const {getAdminDashboard}=require("../src/controllers/admin.controller.ts");
async function main(){
  const mongo=await MongoMemoryServer.create({instance:{launchTimeout:60000}});
  try{
    await mongoose.connect(mongo.getUri());
    const db=mongoose.connection.db;
    const now=new Date(), previous=new Date(now.getFullYear(),now.getMonth()-1,15);
    const user=new mongoose.Types.ObjectId();
    await Promise.all([
      db.collection("users").insertMany([{_id:user,name:"Test Customer",role:"customer",createdAt:now},{role:"customer",createdAt:previous},{role:"admin",createdAt:now}]),
      db.collection("products").insertMany([{createdAt:now,isActive:true,colors:[]},{createdAt:previous,isActive:true,colors:[]}]),
      db.collection("categories").insertOne({name:"Test"}),
      db.collection("banners").insertOne({name:"Test"}),
      db.collection("orders").insertMany([{user,status:"delivered",total:100,createdAt:now,items:[]},{user,status:"cancelled",total:50,createdAt:now,items:[]},{user,status:"pending",total:25,createdAt:previous,items:[]}]),
    ]);
    const call=async()=>{let status,data;await getAdminDashboard({},{status(value){status=value;return this;},json(value){data=value;return this;}});return {status,data};};
    const [a,b]=await Promise.all([call(),call()]);
    assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(a.data.generatedAt,b.data.generatedAt,"Concurrent refreshes share work");
    assert.equal(a.data.stats.products,2);assert.equal(a.data.stats.customers,2);assert.equal(a.data.stats.orders,3);assert.equal(a.data.stats.revenue,125);
    assert.equal(a.data.stats.growth.revenue,300);assert.equal(a.data.stats.growth.orders,100);
    assert.deepEqual(a.data.orderStatus,{pending:1,completed:1,cancelled:1});
    assert.equal(a.data.salesOverview.length,7);assert.equal(a.data.salesOverview.reduce((sum,day)=>sum+day.revenue,0),100);
    const cached=await call();assert.equal(cached.data.generatedAt,a.data.generatedAt);
    console.log("Passed: grouped dashboard counts, revenue excludes cancelled orders, growth, status totals, seven-day chart, concurrent refresh and short cache.");
  }finally{await mongoose.disconnect();await mongo.stop();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
