require('tsx/cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { JSDOM } = require('jsdom');

test('campaign Lead accepts only the same-origin embedded form and cleans up listeners', async () => {
  const dom = new JSDOM('<main id="root"></main>', { url: 'https://hivrasoft.com/reseller-registration' });
  global.window = dom.window; global.document = dom.window.document;
  global.MutationObserver = dom.window.MutationObserver;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const events = [];
  window.fbq = (...args) => events.push(args);
  const Frame = require('../src/components/Campaign/AutoHeightCampaignFrame.tsx').default;
  const { createRoot } = require('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(Frame, { title: 'Reseller Registration', src: '/campaigns/reseller-registration.html' }))));
    const frame = document.querySelector('iframe');
    const send = (origin, source, type) => window.dispatchEvent(new window.MessageEvent('message', { origin, source, data: { type } }));
    send('https://unrelated.example', frame.contentWindow, 'hivrasoft-campaign-submitted');
    send(window.location.origin, window, 'hivrasoft-campaign-submitted');
    send(window.location.origin, frame.contentWindow, 'other-message');
    assert.equal(events.length, 0);
    send(window.location.origin, frame.contentWindow, 'hivrasoft-campaign-submitted');
    assert.deepEqual(events, [['track', 'Lead', { content_name: 'Reseller Registration' }]]);
    const source = frame.contentWindow;
    await React.act(async () => root.unmount());
    send(window.location.origin, source, 'hivrasoft-campaign-submitted');
    assert.equal(events.length, 1);
  } finally {
    dom.window.close(); delete global.window; delete global.document;
    delete global.MutationObserver; delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});
