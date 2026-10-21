require('tsx/cjs');
const test=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const Module=require('node:module');
const {JSDOM}=require('jsdom');

test('Admin product list requests ten rows per page and resets pagination on filtering',async()=>{
  const dom=new JSDOM('<main id="root"></main>',{url:'http://localhost:3000/admin/products'});
  global.window=dom.window;global.document=dom.window.document;global.HTMLElement=dom.window.HTMLElement;
  const originalReact=global.React;
  global.React=React; // tsx loads .jsx with the classic JSX runtime in this test.
  global.IS_REACT_ACT_ENVIRONMENT=true;
  const requests=[];
  const products=Array.from({length:25},(_,i)=>({_id:String(i+1),isActive:i<12,isColor:true,categories:[],colors:[{_id:'color',nameProduct:`Product ${i+1}`,slugProduct:`product-${i+1}`,isDefault:true,sizes:[],images:[]}]}));
  const originalLoad=Module._load;
  Module._load=function(request,...args){
    if(request==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)};
    if(request==='@/src/components/Admin/AdminConfirmProvider')return {confirmAdminAction:async()=>false};
    if(request==='@/lib/api')return {ApiError:class extends Error{},apiFetch:async path=>{
      const params=new URL(path,'http://localhost').searchParams;requests.push(Object.fromEntries(params));
      const filtered=params.get('status')==='active'?products.filter(p=>p.isActive):products;
      const page=Number(params.get('page'));return {products:filtered.slice((page-1)*10,page*10),categories:[],pagination:{page,pageSize:10,total:filtered.length,totalPages:Math.ceil(filtered.length/10),totalProducts:products.length}};
    }};
    return originalLoad.call(this,request,...args);
  };
  let root;
  const flush=()=>new Promise(r=>setImmediate(r));
  const click=async label=>{
    const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label);
    assert.ok(button,`Missing ${label}`);await React.act(async()=>{button.click();await flush();});
  };
  try {
    const Manager=require('../src/components/Admin/ProductsManager.jsx').default;
    const {createRoot}=require('react-dom/client');root=createRoot(document.getElementById('root'));
    await React.act(async()=>{root.render(React.createElement(Manager));await flush();});
    const rowCheckboxes=()=>document.querySelectorAll('input[aria-label^="Select Product "]');
    assert.equal(rowCheckboxes().length,10);assert.equal(requests.at(-1).page,'1');assert.equal(requests.at(-1).limit,'10');
    assert.match(document.body.textContent,/Page 1 of 3/);
    await React.act(async()=>document.querySelector('input[aria-label="Select all visible products"]').click());
    assert.equal([...rowCheckboxes()].filter(c=>c.checked).length,10);
    await click('Next');assert.equal(requests.at(-1).page,'2');assert.equal(rowCheckboxes().length,10);
    assert.equal([...rowCheckboxes()].filter(c=>c.checked).length,0,'Selection is scoped to the visible page');
    await click('Next');assert.equal(requests.at(-1).page,'3');assert.equal(rowCheckboxes().length,5);
    assert.ok([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Next').disabled);
    const status=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.text==='All status'));
    await React.act(async()=>{status.value='active';status.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await flush();});
    assert.equal(requests.at(-1).page,'1');assert.equal(requests.at(-1).status,'active');assert.match(document.body.textContent,/Page 1 of 2/);
    await click('Next');assert.equal(rowCheckboxes().length,2);
    await click('Previous');assert.equal(rowCheckboxes().length,10);
  } finally {
    if(root)await React.act(async()=>root.unmount());Module._load=originalLoad;dom.window.close();delete global.IS_REACT_ACT_ENVIRONMENT;
    if(originalReact===undefined)delete global.React;else global.React=originalReact;
  }
});
