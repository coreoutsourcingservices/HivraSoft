require("tsx/cjs");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {pageMetadata,description,breadcrumbSchema,SITE_URL}=require("../lib/seo.ts");
const {buildSitemap}=require("../lib/sitemap-data.ts");
const robots=require("../app/robots.ts").default;
const meta=pageMetadata({path:"/product/test",title:"API Product Title",description:"<p>API product description</p>",image:"https://cdn.example.com/item.webp"});
assert.equal(SITE_URL,"https://www.hivrasoft.com");
assert.equal(meta.title.absolute,"API Product Title | HivraSoft");
assert.equal(meta.description,"API product description");
assert.equal(meta.alternates.canonical,`${SITE_URL}/product/test`);
assert.equal(meta.openGraph.url,meta.alternates.canonical);
assert.equal(meta.twitter.card,"summary_large_image");
assert.equal(meta.openGraph.images[0].url,"https://cdn.example.com/item.webp");
assert(description("long content ".repeat(50)).length<=160);
assert.equal(pageMetadata({path:"/account",title:"Account",noindex:true}).robots.index,false);
assert.equal(pageMetadata({path:"/post",title:"Post",canonical:"https://example.org/source"}).alternates.canonical,"https://example.org/source");
assert.equal(breadcrumbSchema([{name:"Home",path:"/"},{name:"Product",path:"/product/test"}]).itemListElement[1].position,2);
assert.equal(robots().sitemap,`${SITE_URL}/sitemap.xml`);
const sitemap=buildSitemap([
  {isActive:true,colors:[{slugProduct:"blue"},{slugProduct:"red"},{slugProduct:"hidden",isActive:false}],updatedAt:"2026-10-10T00:00:00Z"},
  {isActive:false,slug:"inactive"},
],[{slug:"women",name:"Women",children:[{slug:"bras",children:[]},{slug:"hidden",isActive:false}]}],[
  {slug:"journal-post",status:"PUBLISHED"},{slug:"private",status:"PRIVATE"},{slug:"noindex",seo:{robots:{index:false}}},{slug:"duplicate",seo:{canonicalUrl:"https://example.org/original"}},
],[{slug:"buy-3-get-1-free",offerType:"buy_get",isActive:true},{slug:"inactive-offer",offerType:"buy_get",isActive:false}]);
const urls=sitemap.map(item=>item.url);
for(const path of ["/product/blue","/product/red","/women/bras","/journal-post","/offers/buy-3-get-1-free"])assert(urls.includes(`${SITE_URL}${path}`),path);
assert(!urls.some(url=>/hidden|inactive|private|noindex|duplicate|\/account|\/cart|\/wishlist|\/search/.test(url)));
assert.equal(new Set(urls).size,urls.length);
const dynamic=new Set(["[slug]","product","product-tag","women","men","accessories","offers"]);
for(const item of fs.readdirSync("app",{withFileTypes:true})){
  if(!item.isDirectory()||dynamic.has(item.name))continue;
  const path=`app/${item.name}/page.tsx`;
  if(!fs.existsSync(path))continue;
  const source=fs.readFileSync(path,"utf8");
  if(source.includes("notFound();")||source.includes("generateMetadata"))continue;
  assert(fs.existsSync(`app/${item.name}/layout.tsx`),`Metadata missing for ${item.name}`);
}
const blog=fs.readFileSync("app/[slug]/page.tsx","utf8");
assert(blog.includes('"@type":"BlogPosting"'));
assert(blog.includes('"<$1h2"'));
async function testSitemapRoute(){
  const originalFetch=global.fetch;
  const requests=[];
  try{
    global.fetch=async(input)=>{
      const url=String(input);requests.push(url);
      let data={};
      if(url.includes("/products/active"))data={products:[{slug:"test-product",isActive:true}]};
      else if(url.includes("/categories/tree"))data={categories:[{slug:"men",children:[]}]};
      else if(url.includes("/offers"))data={offers:[]};
      else if(url.includes("page=2"))data={blogs:[{slug:"second-page-post",status:"PUBLISHED"}],pagination:{totalPages:2}};
      else data={blogs:[{slug:"first-page-post",status:"PUBLISHED"}],pagination:{totalPages:2}};
      return {ok:true,json:async()=>data};
    };
    const generate=require("../app/sitemap.ts").default;
    const entries=await generate();
    assert(entries.some(entry=>entry.url===`${SITE_URL}/second-page-post`));
    assert(requests.some(url=>url.includes("page=2")),"Sitemap follows API pagination");
    global.fetch=async()=>({ok:false,status:503});
    await assert.rejects(generate,/Sitemap source unavailable/);
  }finally{global.fetch=originalFetch;}
  console.log("Passed: metadata, API overrides, description limits, canonical/OG/Twitter, noindex, breadcrumbs, robots, sitemap filtering/pagination/failure handling and route coverage.");
}
testSitemapRoute().catch(error=>{console.error(error);process.exitCode=1;});
