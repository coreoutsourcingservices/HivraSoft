require('tsx/cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {prepareNotificationHtml} = require('../backend/src/services/notification-html.service.ts');
const {prepareProductDescriptionHtml} = require('../backend/src/utils/productHtml.ts');
const {prepareBlogHtml} = require('../backend/src/services/blog.service.ts');
const fixture = fs.readFileSync(path.join(__dirname,'fixtures/diwali-notification.html'),'utf8');
const custom = ` \n<!DOCTYPE html><html><head><style>@media(max-width:600px){my-card{display:grid;grid-template-columns:1fr;--accent:gold}}</style></head><body><!-- keep comments --><my-card data-custom="value" aria-label="custom" style="filter:blur(0);padding:clamp(1px,2vw,20px)"><svg viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg><video controls><source src="/video.mp4"></video><details open><summary>More</summary>Text</details><iframe src="https://example.test"></iframe><script>window.example=true</script><button onclick="window.example=true">Example</button></my-card></body></html>\n `;

test('Every admin HTML save path preserves arbitrary tags, CSS, attributes and whitespace', () => {
  for(const prepare of [prepareNotificationHtml,prepareProductDescriptionHtml,prepareBlogHtml]) {
    assert.equal(prepare(custom),custom);
    assert.equal(prepare(fixture),fixture);
    assert.equal(prepare(prepare(custom)),custom,'Repeated saves must not alter the source');
    assert.equal(prepare(null),'');
    assert.equal(prepare('  \n '),'');
  }
});

test('Notification and schedule model setters do not trim or change stored HTML', () => {
  const Notification=require('../backend/src/models/Notification.model.ts').default;
  const Schedule=require('../backend/src/models/NotificationSchedule.model.ts').default;
  const Blog=require('../backend/src/models/Blog.model.ts').default;
  assert.equal(new Notification({message:prepareNotificationHtml(custom)}).message,custom);
  assert.equal(new Schedule({message:prepareNotificationHtml(custom)}).message,custom);
  assert.equal(new Blog({content:prepareBlogHtml(custom)}).content,custom);
});

test('Input validation rejects invalid types and oversized source without truncating it', () => {
  assert.throws(()=>prepareNotificationHtml({html:'<p>example</p>'}),/HTML string/);
  assert.throws(()=>prepareNotificationHtml('x'.repeat(50_001)),/too large/);
  assert.throws(()=>prepareProductDescriptionHtml('x'.repeat(100_001)),/too large/);
});

test('Display sanitization removes active code without mutating the stored source', () => {
  const DOMPurify=require('isomorphic-dompurify');
  const stored=prepareNotificationHtml(custom);
  const displayed=DOMPurify.sanitize(stored);
  assert.doesNotMatch(displayed,/<script|onclick\s*=/i);
  assert.equal(stored,custom);
});

test('Email transport receives the exact original HTML; no real email is sent', async () => {
  const Module=require('node:module');
  const originalLoad=Module._load;
  const originalUser=process.env.SMTP_USER,originalPass=process.env.SMTP_PASS;
  process.env.SMTP_USER='local-test';process.env.SMTP_PASS='local-test';
  let captured;
  Module._load=function(request,...args){
    if(request==='../config/mail')return {__esModule:true,default:{sendMail:async options=>{captured=options;}}};
    return originalLoad.call(this,request,...args);
  };
  try {
    const {sendEmail}=require('../backend/src/services/mail.service.ts');
    await sendEmail({to:'preview@hivrasoft.test',subject:'Local preview',html:prepareNotificationHtml(custom)});
    assert.equal(captured.html,custom);
  } finally {
    Module._load=originalLoad;
    for(const [key,value] of [['SMTP_USER',originalUser],['SMTP_PASS',originalPass]]) {
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
  }
});
