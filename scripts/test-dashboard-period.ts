import assert from "node:assert/strict";
import { dashboardPeriodData, dashboardPeriods } from "../app/admin/dashboard-period";
const now = new Date("2026-11-16T12:00:00Z");
const orders = [
  { _id: "1", createdAt: "2026-11-10T00:00:00Z", status: "confirmed", total: 100 },
  { _id: "2", createdAt: "2026-11-16T23:59:59Z", status: "completed", total: 200 },
  { _id: "3", createdAt: "2026-11-15T12:00:00Z", status: "cancelled", total: 300 },
  { _id: "4", createdAt: "2026-11-09T23:59:59Z", status: "delivered", total: 400 },
  { _id: "5", createdAt: "2025-10-01T12:00:00Z", status: "completed", total: 500 },
];
const week = dashboardPeriodData(orders, { period: "7_days" }, now);
assert.deepEqual(week.orderStatus, { pending: 1, completed: 1, cancelled: 1 });
assert.equal(week.salesOverview.length, 7);
assert.equal(week.salesOverview.reduce((sum, row) => sum + row.revenue, 0), 300);
assert.deepEqual(week.recentOrders.map((row) => row.id), ["2", "3", "1"]);
const custom = dashboardPeriodData(orders, { period: "all", from: "2026-11-15", to: "2026-11-15" }, now);
assert.deepEqual(custom.orderStatus, { pending: 0, completed: 0, cancelled: 1 });
assert.equal(custom.recentOrders[0].id, "3");
assert.equal(custom.salesOverview[0].revenue, 0);
for (const [period] of dashboardPeriods) {
  const result = dashboardPeriodData(orders, { period }, now);
  const expected = period === "7_days" ? 3 : period === "all" ? 5 : 4;
  assert.equal(Object.values(result.orderStatus).reduce((sum, n) => sum + n, 0), expected, period);
  assert.equal(result.salesOverview.reduce((sum, row) => sum + row.orders, 0), expected, period);
}
const empty = dashboardPeriodData([], { period: "7_days" }, now);
assert.equal(empty.recentOrders.length, 0);
assert.equal(empty.salesOverview.length, 7);
assert.equal(empty.salesOverview.reduce((sum, row) => sum + row.revenue, 0), 0);
console.log("PASS: all six presets, custom date boundaries, revenue excludes cancellation, recent sorting, empty ranges");
