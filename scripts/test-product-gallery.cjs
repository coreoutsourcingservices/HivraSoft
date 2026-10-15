const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const site = process.env.TEST_SITE_URL || 'http://127.0.0.1:3000';
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  for (const width of [375,1920,3840]) {
   const page = await browser.newPage({viewport:{width,height:1000}});
   const errors=[]; page.on('pageerror',error=>errors.push(error.message));
   await page.goto(site+'/product/mens-edge-micro-modal-brief-pack-of-4',{waitUntil:'networkidle',timeout:120000});


   console.log(width+'px loaded');
   assert.equal(await page.evaluate(() => {
    window.scrollTo(1000, window.scrollY);
    return window.scrollX;
   }), 0, 'Page must not scroll horizontally');
   const gallery=page.getByRole('region',{name:'Product image gallery',exact:true});
   const thumbnails=gallery.getByRole('button',{name:/^Select product image /});
   const main=gallery.locator('img').last();
   const original=await main.getAttribute('src');
   const color=page.locator('button[aria-label^="Select color "][aria-pressed="true"]');
   const initialColor=await color.getAttribute('aria-label');
   await thumbnails.nth(1).hover();
   assert.equal(await main.getAttribute('src'),original,'Hover must not select image');
   await thumbnails.nth(1).click();
   await page.waitForFunction(() => document.querySelector('[aria-label="Select product image 2"]')?.getAttribute('aria-pressed') === 'true', null, {polling:100});
   assert.equal(await main.getAttribute('src'),await thumbnails.nth(1).locator('img').getAttribute('src'));
   const selected=await main.getAttribute('src');
   const url=page.url();
   await page.waitForTimeout(3100);
   assert.equal(await color.getAttribute('aria-label'),initialColor,'Color stays selected during image autoplay');
   assert.notEqual(await main.getAttribute('src'),selected,'Image advances after 3 seconds');
   assert.equal(page.url(),url,'Autoplay must not navigate or add history');
   if(width>1000) {
    await page.evaluate(()=>{window.__flashes=[];new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof HTMLElement && node.matches('.hivra-mini-flash,.hivra-festive-flash')){const rect=node.parentElement.getBoundingClientRect();window.__flashes.push({x:rect.left+parseFloat(node.style.left),y:rect.top+parseFloat(node.style.top),zoom:node.parentElement.currentCSSZoom});}}).observe(document.body,{subtree:true,childList:true});});
    await page.evaluate(() => document.dispatchEvent(new MouseEvent('click', {clientX:600,clientY:400,bubbles:true})));
    const flashes=await page.evaluate(()=>window.__flashes);
    assert(flashes.some(f=>Math.abs(f.x-600)<2 && Math.abs(f.y-400)<2 && f.zoom===1),'Party burst starts at cursor without desktop zoom offset');
    await gallery.getByRole('button',{name:'Zoom image',exact:true}).click();
    const before=await main.getAttribute('src');
    await page.waitForTimeout(6100);
    assert.equal(await main.getAttribute('src'),before,'Zoom pauses image autoplay');
    await page.getByRole('button',{name:'Close zoom',exact:true}).click();
   }
   const sizes=page.getByRole('button',{name:/^(S|M|L|XL|XXL)$/});
   for(let i=0;i<await sizes.count();i++)if(await sizes.nth(i).isEnabled()){
    await sizes.nth(i).click();const locked=await main.getAttribute('src');
    await page.waitForTimeout(6100);assert.equal(await main.getAttribute('src'),locked,'Selected size pauses image autoplay');break;
   }
   assert.equal(errors.length,0,errors.join('; '));
   console.log(width+'px: 3-second images, stable color/URL, click-only thumbnails, purchase/zoom pause, cursor burst passed');
   await page.close();
  }
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
