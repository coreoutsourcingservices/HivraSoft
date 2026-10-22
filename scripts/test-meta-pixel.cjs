require('tsx/cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const Module = require('node:module');
const { JSDOM } = require('jsdom');

test('Meta Pixel initializes once, tracks navigation and renders a no-JS fallback', async () => {
  const dom = new JSDOM('<!doctype html><html><body><script></script><main id="root"></main></body></html>', {url:'http://localhost:3000/', runScripts:'outside-only'});
  global.window = dom.window; global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  let pathname = '/';
  const executed = new Set();
  const originalLoad = Module._load;
  const originalId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const originalEnabled = process.env.NEXT_PUBLIC_META_PIXEL_ENABLED;
  delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
  delete process.env.NEXT_PUBLIC_META_PIXEL_ENABLED;
  Module._load = function(request, ...args) {
    if (request === 'next/navigation') return {usePathname:() => pathname};
    if (request === 'next/script') return {__esModule:true, default:function Script(props) {
      React.useEffect(() => {
        if (!executed.has(props.id)) { executed.add(props.id); dom.window.eval(props.dangerouslySetInnerHTML.__html); }
      }, [props.id]);
      return null;
    }};
    return originalLoad.call(this, request, ...args);
  };
  const file = require.resolve('../src/components/Analytics/MetaPixel.tsx');
  delete require.cache[file]; delete require.cache[require.resolve("../lib/meta-pixel.ts")];
  let root;
  try {
    const Pixel = require(file).default;
    const {createRoot} = require('react-dom/client');
    const {renderToStaticMarkup} = require('react-dom/server');
    const markup = renderToStaticMarkup(React.createElement(Pixel));
    assert.match(markup, /<noscript>/);
    assert.match(markup, /id=950535477792189&amp;ev=PageView&amp;noscript=1/);
    root = createRoot(document.getElementById('root'));
    const render = () => React.act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(Pixel))));
    await render();
    const events = () => Array.from(dom.window.fbq.queue, entry => Array.from(entry));
    assert.deepEqual(events(), [['init','950535477792189'],['track','PageView']]);
    assert.equal(document.querySelectorAll('script[src="https://connect.facebook.net/en_US/fbevents.js"]').length, 1);
    pathname = '/products'; await render();
    assert.equal(events().filter(e => e[1] === 'PageView').length, 2);
    await render();
    assert.equal(events().filter(e => e[1] === 'PageView').length, 2, 'Rerenders must not double-count');
    process.env.NEXT_PUBLIC_META_PIXEL_ENABLED = 'false'; delete require.cache[file]; delete require.cache[require.resolve("../lib/meta-pixel.ts")];
    assert.equal(renderToStaticMarkup(React.createElement(require(file).default)), '');
    process.env.NEXT_PUBLIC_META_PIXEL_ENABLED = 'true'; process.env.NEXT_PUBLIC_META_PIXEL_ID = 'invalid'; delete require.cache[file]; delete require.cache[require.resolve("../lib/meta-pixel.ts")];
    assert.equal(renderToStaticMarkup(React.createElement(require(file).default)), '');
  } finally {
    if (root) await React.act(async () => root.unmount());
    Module._load = originalLoad; delete require.cache[file]; delete require.cache[require.resolve("../lib/meta-pixel.ts")]; dom.window.close();
    for (const [key, value] of [['NEXT_PUBLIC_META_PIXEL_ID',originalId],['NEXT_PUBLIC_META_PIXEL_ENABLED',originalEnabled]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
