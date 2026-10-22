require('tsx/cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
test('queues early events, deduplicates purchases, and tracks only successful commerce actions', async () => {
  const saved = new Map();
  global.window = { localStorage: { getItem: key => saved.get(key), setItem: (key,value) => saved.set(key,value) }, dispatchEvent() {} };
  const pixel = require('../lib/meta-pixel.ts');
  const events = [];
  pixel.trackMetaEvent('ViewContent', { content_ids: ['product-1'] });
  window.fbq = (...args) => events.push(args);
  pixel.flushMetaEvents();
  assert.equal(events[0][1], 'ViewContent');
  pixel.trackMetaPurchase({ id: 'order-1', total: 599 });
  pixel.trackMetaPurchase({ id: 'order-1', total: 599 });
  assert.equal(events.filter(e => e[1] === 'Purchase').length, 1);
  assert.deepEqual(events[1].slice(2), [{ value: 599, currency: 'INR', order_id: 'order-1' }, { eventID: 'purchase:order-1' }]);
  let response = { success: true };
  const original = Module._load;
  Module._load = function(request, ...args) {
    if (request === './api' || request === '@/lib/api') return { apiFetch: async () => { if (response instanceof Error) throw response; return response; } };
    if (request === '@/lib/traffic-source') return { getTrafficSourceForOrder: () => ({}) };
    return original.call(this, request, ...args);
  };
  try {
    const cart = require('../lib/cart.ts');
    const checkout = require('../lib/checkout.ts');
    const input = { productId: 'p1', colorId: 'c1', sizeId: 's1', quantity: 2 };
    await cart.addToCart(input);
    assert.equal(events.at(-1)[1], 'AddToCart');
    const count = events.length;
    response = { success: false }; await cart.addToCart(input);
    response = new Error('failed'); await assert.rejects(cart.addToCart(input));
    assert.equal(events.length, count);
    response = { success: true, order: { _id: 'paid-order', total: 1234, paymentStatus: 'paid' } };
    await checkout.verifyRazorpayPayment({}); await checkout.verifyRazorpayPayment({});
    assert.equal(events.filter(e => e[1] === 'Purchase').length, 2);
    response = { success: true, order: { _id: 'failed-order', total: 1234, paymentStatus: 'failed' } };
    await checkout.verifyRazorpayPayment({});
    assert.equal(events.filter(e => e[1] === 'Purchase').length, 2);
    response = { success: true, order: { _id: 'cod-order', total: 899, paymentStatus: 'pending' } };
    await checkout.createCodOrder({ id: 'address-1' });
    assert.equal(events.at(-1)[1], 'Purchase');
    assert.equal(events.at(-1)[2].value, 899);
  } finally { Module._load = original; delete global.window; }
});
