require('tsx/cjs');
const test=require('node:test');
const assert=require('node:assert/strict');
const mongoose=require('../backend/node_modules/mongoose');
const {getAdminProductsPage,parseAdminProductPage}=require('../backend/src/services/admin-product-list.service.ts');
const Product=require('../backend/src/models/Product.model.ts').default;
const Category=require('../backend/src/models/Category.model.ts').default;

test('Admin product pages: database limits, filters, deleted records and final-page clamping', async () => {
  const database=`hivrasoft_pagination_test_${Date.now()}`;
  const testServer=new URL(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017');
  assert.equal(testServer.protocol,'mongodb:');
  assert.ok(['127.0.0.1','localhost'].includes(testServer.hostname),'Pagination tests only use a local test database');
  testServer.pathname=`/${database}`;
  await mongoose.connect(testServer.toString(),{serverSelectionTimeoutMS:10000});
  try {
    const a=new mongoose.Types.ObjectId(),b=new mongoose.Types.ObjectId();
    await Category.collection.insertMany([{_id:a,name:'Rose category',slug:'rose'},{_id:b,name:'Blue category',slug:'blue'}]);
    const docs=Array.from({length:25},(_,index)=>{
      const n=index+1;
      return {_id:new mongoose.Types.ObjectId(),createdAt:new Date(Date.UTC(2026,9,21,0,0,26-n)),isActive:n<=12,isColor:n%2===0,isDeleted:false,categories:[n<=12?a:b],colors:[{nameProduct:`Product ${n}`,slugProduct:`product-${n}`,nameColor:'Blue',isDefault:true,images:[],sizes:[{size:'M',stock:n%3===0?0:n%3===1?5:20,isActive:true},{size:'L',stock:1000,isActive:false}]}]};
    });
    await Product.collection.insertMany([...docs,{...docs[0],_id:new mongoose.Types.ObjectId(),isDeleted:true}]);
    const first=await getAdminProductsPage({page:'1',limit:'999'});
    const second=await getAdminProductsPage({page:'2'});
    const last=await getAdminProductsPage({page:'3'});
    assert.equal(first.products.length,10);assert.equal(second.products.length,10);assert.equal(last.products.length,5);
    assert.equal(first.pagination.total,25);assert.equal(first.pagination.totalPages,3);
    assert.equal(first.categories.length,2);assert.equal(last.categories.length,2);
    assert.deepEqual(first.products.map(p=>String(p._id)),docs.slice(0,10).map(p=>String(p._id)));
    assert.equal(new Set([...first.products,...second.products,...last.products].map(p=>String(p._id))).size,25);
    assert.equal((await getAdminProductsPage({page:'999'})).pagination.page,3);
    assert.equal((await getAdminProductsPage({page:'2',status:'active'})).products.length,2);
    assert.equal((await getAdminProductsPage({page:'1',category:String(b)})).pagination.total,13);
    assert.equal((await getAdminProductsPage({page:'1',search:'Rose category'})).pagination.total,12);
    assert.equal((await getAdminProductsPage({page:'1',search:'Product 24'})).pagination.total,1);
    assert.equal((await getAdminProductsPage({page:'1',search:'.*'})).pagination.total,0);
    assert.equal((await getAdminProductsPage({page:'1',category:'invalid'})).pagination.total,0);
    assert.equal((await getAdminProductsPage({page:'1',productType:'color'})).pagination.total,12);
    assert.equal((await getAdminProductsPage({page:'1',stockStatus:'low'})).pagination.total,9);
    assert.equal((await getAdminProductsPage({page:'1',stockStatus:'out'})).pagination.total,8);
    assert.equal((await getAdminProductsPage({page:'1',stockStatus:'in'})).pagination.total,8);
    assert.equal((await getAdminProductsPage({page:'1',seoStatus:'poor'})).pagination.total,25);
    assert.equal((await getAdminProductsPage({page:'1',seoStatus:'good'})).pagination.total,0);
    await Product.collection.updateMany({_id:{$in:docs.slice(20).map(p=>p._id)}},{$set:{isDeleted:true}});
    const clamped=await getAdminProductsPage({page:'3'});
    assert.equal(clamped.pagination.page,2);assert.equal(clamped.pagination.total,20);
    const empty=await getAdminProductsPage({page:'5',search:'missing product'});
    assert.equal(empty.pagination.page,1);assert.equal(empty.pagination.totalPages,1);assert.equal(empty.products.length,0);
  } finally {
    if(mongoose.connection.host==='127.0.0.1'&&mongoose.connection.name===database&&database.startsWith('hivrasoft_pagination_test_'))await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

test('Invalid page numbers are normalized',()=>{
  for(const input of [undefined,'0','-1','abc','1.5',Number.MAX_VALUE])assert.equal(parseAdminProductPage(input),1);
  assert.equal(parseAdminProductPage('2'),2);
});
