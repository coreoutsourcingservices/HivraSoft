// Usage: node scripts/complete-woocommerce-orders.cjs [--apply]
// Only orders.origin.source=woocommerce orders.status is updated.
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));
backendRequire('dotenv').config({ path: path.resolve(__dirname, '../backend/.env'), quiet: true });
const { MongoClient, BSON } = backendRequire('mongoose').mongo;

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const orders = client.db().collection('orders');
    const filter = { 'origin.source': /^woocommerce$/i };
    const matches = await orders.find(filter).toArray();
    const summary = await orders.aggregate([
      { $match: filter },
      { $group: { _id: { source: '$origin.source', medium: '$origin.medium', status: '$status' }, count: { $sum: 1 } } },
    ]).toArray();
    const pending = matches.filter((order) => order.status !== 'completed');
    console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', matched: matches.length, toUpdate: pending.length, summary }, null, 2));
    if (!process.argv.includes('--apply') || !pending.length) return;

    const backupDir = path.resolve(__dirname, '../.local/order-status-backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const backup = path.join(backupDir, `woocommerce-${Date.now()}.json`);
    fs.writeFileSync(backup, BSON.EJSON.stringify(pending, { relaxed: false }), { flag: 'wx' });
    // Native collection bypasses model hooks, timestamps, payment and inventory logic.
    const result = await orders.updateMany(
      { $and: [filter, { _id: { $in: pending.map((order) => order._id) } }, { status: { $ne: 'completed' } }] },
      { $set: { status: 'completed' } },
    );
    const after = await orders.find({ _id: { $in: pending.map((order) => order._id) } }).toArray();
    const originals = new Map(pending.map((order) => [String(order._id), order]));
    for (const order of after) {
      if (order.status !== 'completed') throw new Error('Status verification failed');
      const original = originals.get(String(order._id));
      const expected = { ...original, status: 'completed' };
      if (BSON.EJSON.stringify(order) !== BSON.EJSON.stringify(expected)) {
        throw new Error('Unexpected field difference detected during verification');
      }
    }
    if (after.length !== pending.length) throw new Error('Order count verification failed');
    const remaining = await orders.countDocuments({ ...filter, status: { $ne: 'completed' } });
    console.log(JSON.stringify({ modified: result.modifiedCount, verified: after.length, remaining, backup, updatedFields: ['status'] }, null, 2));
    if (remaining) throw new Error('Some WooCommerce orders remain incomplete');
  } finally {
    await client.close();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
