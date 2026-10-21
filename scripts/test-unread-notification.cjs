// Isolated customer inbox interaction checks; never connects to the backend.
require('tsx/cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const React = require('react');
const Module = require('node:module');

test('unread card: Later dismisses the popup for the session without marking read', async () => {
  const dom = new JSDOM('<!doctype html><html><body><main id="root"></main></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.sessionStorage = dom.window.sessionStorage;
  const originalEvent = global.Event;
  global.Event = dom.window.Event;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  let pathname = '/';
  let user = { id: 'customer-one', role: 'customer' };
  const notification = (id, title, date, isRead = false) => ({ _id: id, title, message: '<p>Customer message</p><script>alert(1)</script>', type: 'general', createdAt: date, isRead });
  let items = [notification('01', 'Old message', '2026-10-19'), notification('03', 'Newest message', '2026-10-21'), notification('02', 'Middle message', '2026-10-20'), notification('04', 'Already read', '2026-10-22', true)];
  let failRead = false;
  const requests = [];
  const api = { ApiError: class ApiError extends Error {}, apiFetch: async (url, options = {}) => {
    requests.push([url, options.method || 'GET']);
    if (url === '/api/auth/me') return { user };
    if (url === '/api/notifications') return { notifications: items.map(x => ({ ...x })), unreadCount: items.filter(x => !x.isRead).length };
    if (options.method === 'PATCH') { if (failRead) throw Error('Offline'); const id = url.split('/')[3]; items = items.map(x => x._id === id ? { ...x, isRead: true } : x); return { success: true }; }
    throw Error('Unexpected request: ' + url);
  }};
  const originalLoad = Module._load;
  Module._load = function(request, ...args) {
    if (request === 'next/navigation') return { usePathname: () => pathname };
    if (request === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (request === '@/lib/api') return api;
    return originalLoad.call(this, request, ...args);
  };
  let root;
  const { act } = React;
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const text = () => document.body.textContent;
  async function click(label) { const button = [...document.querySelectorAll('button')].find(x => x.textContent === label); assert.ok(button, `Missing ${label} button`); await act(async () => { button.click(); await flush(); }); }
  try {
    const Card = require('../src/components/Storefront/UnreadNotificationCard.tsx').default;
    const { createRoot } = require('react-dom/client');
    root = createRoot(document.getElementById('root'));
    await act(async () => { root.render(React.createElement(Card)); await flush(); });
    assert.match(text(), /Newest message/);
    assert.match(text(), /3 unread/);
    assert.match(text(), /2 other unread/);
    assert.equal(document.querySelector('aside script'), null);
    failRead = true; await click('Mark as read'); assert.match(text(), /Could not mark as read/); assert.match(text(), /Newest message/);
    failRead = false; await click('Mark as read'); assert.match(text(), /Middle message/); assert.match(text(), /2 unread/);
    const writesBeforeLater = requests.filter(x => x[1] === 'PATCH').length;
    await click('Later');
    assert.equal(document.querySelector('aside'), null, 'One Later click must hide the entire popup');
    assert.equal(requests.filter(x => x[1] === 'PATCH').length, writesBeforeLater, 'Later must not mark as read');
    assert.equal(items.filter(x => !x.isRead).length, 2, 'Unread notifications must remain unread');
    pathname = '/products'; await act(async () => { root.render(React.createElement(Card)); await flush(); });
    assert.equal(document.querySelector('aside'), null, 'Dismissal must survive navigation');
    await act(async () => { root.unmount(); });
    root = createRoot(document.getElementById('root'));
    await act(async () => { root.render(React.createElement(Card)); await flush(); });
    assert.equal(document.querySelector('aside'), null, 'Dismissal must survive remount/reload');
    items.push(notification('05', 'Just arrived', '2026-10-23'));
    await act(async () => { window.dispatchEvent(new window.Event('focus')); await flush(); });
    assert.equal(document.querySelector('aside'), null, 'Polling/new messages must not reopen a dismissed popup');
    user = { id: 'customer-two', role: 'customer' }; items = [notification('06', 'Second account', '2026-10-24')];
    await act(async () => { window.dispatchEvent(new window.Event('hivrasoft-auth-changed')); await flush(); });
    assert.match(text(), /Second account/); assert.doesNotMatch(text(), /Just arrived|Old message/);
    user = { id: 'customer-one', role: 'customer' };
    await act(async () => { window.dispatchEvent(new window.Event('hivrasoft-auth-changed')); await flush(); });
    assert.equal(document.querySelector('aside'), null, 'Dismissal must stay scoped to the original account');
    user = { id: 'admin', role: 'admin' };
    await act(async () => { window.dispatchEvent(new window.Event('hivrasoft-auth-changed')); await flush(); });
    assert.equal(document.querySelector('aside'), null, 'Admin should never see customer card');
    user = { id: 'customer-two', role: 'customer' };
    await act(async () => { window.dispatchEvent(new window.Event('hivrasoft-auth-changed')); await flush(); });
    pathname = '/admin'; await act(async () => { root.render(React.createElement(Card)); await flush(); });
    assert.equal(document.querySelector('aside'), null);
  } finally {
    if (root) await act(async () => root.unmount());
    Module._load = originalLoad;
    dom.window.close();
    global.Event = originalEvent;
    delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});

test('equal timestamps are sorted newest ObjectId first without mutating API data', () => {
  const { newestNotifications, unreadQueue } = require('../lib/notifications.ts');
  const items = [{ _id: 'a', createdAt: '2026-10-21', isRead: false }, { _id: 'b', createdAt: '2026-10-21', isRead: false }];
  assert.deepEqual(newestNotifications(items).map(x => x._id), ['b', 'a']);
  assert.deepEqual(items.map(x => x._id), ['a', 'b']);
  assert.deepEqual(unreadQueue(items, ['b']).map(x => x._id), ['a']);
});
