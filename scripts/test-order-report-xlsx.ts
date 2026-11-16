import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { buildOrderReportXlsx } from "../backend/src/services/order-report-export.service";
import { buildOrderReport, type OrderReport, type NormalizedOrderRow } from "../backend/src/services/order-report.service";

function unzip(buffer: Buffer) {
  const entries = new Map<string, string>();
  let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    const size = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString();
    const start = offset + 30 + nameLength + extraLength;
    entries.set(name, inflateRawSync(buffer.subarray(start, start + size)).toString());
    offset = start + size;
  }
  return entries;
}

async function main() {
  const base = {
    orderId: "one", orderNumber: "TEST-001", orderStatus: "completed", orderDate: new Date("2026-11-01T00:00:00Z"),
    customerName: "Test Customer", billingAddress: "Test address", billingCity: "Test city", billingState: "Delhi", billingStateCode: "DL", billingCountry: "IN", billingPostcode: "001234",
    customerEmail: "", customerPhone: "", paymentMethod: "cod", discount: 0, subtotal: 100, shipping: 0, refund: 0, total: 105, tax: 5,
    sku: "SKU-001", itemNumber: "product-id", itemName: "Test item", quantity: 1, itemCost: 100, couponCode: "", itemDiscount: 0,
  } as NormalizedOrderRow;
  const report = {
    rows: [base, { ...base, sku: "", subtotal: 0, total: 0, tax: 0 }, { ...base, orderId: "two", orderNumber: "TEST-002", customerName: "Single", couponCode: "SAVE", total: 105 }],
    stateSummary: [{ stateCode: "DL", state: "Delhi", orders: 2, quantity: 3, subtotal: 200, discount: 0, total: 210, tax: 10 }],
  } as OrderReport;
  const files = unzip(buildOrderReportXlsx(report));
  const details = files.get("xl/worksheets/sheet2.xml")!;
  assert(details.includes("Coupon Code"), "Partially populated columns must remain");
  assert(details.includes("SKU"));
  assert(!details.includes("Email (Billing)"), "Entirely empty columns must be removed");
  assert(!details.includes("Phone (Billing)"));
  assert(details.includes("Order Shipping Amount"), "Numeric zero is data");
  assert(details.includes("001234"), "Postal code must remain text");
  assert(details.includes('<c r="C2" s="5"><v>46327</v></c>'), "Dates must be numeric and formatted");
  assert(details.includes('topLeftCell="A2"'));
  const headerCells = [...details.matchAll(/<row r="1"[^>]*>(.*?)<\/row>/g)][0][1];
  const itemColumn = [...headerCells.matchAll(/<c r="([A-Z]+)1".*?<t[^>]*>(.*?)<\/t>.*?<\/c>/g)].find((cell) => cell[2] === "Item #")![1];
  for (const [row, value] of [[2, 1], [3, 2], [4, 1]]) assert(details.includes(`<c r="${itemColumn}${row}" s="0"><v>${value}</v></c>`));
  const summary = files.get("xl/worksheets/sheet1.xml")!;
  assert(summary.includes("GST Report - State Wise Summary"));
  assert(summary.includes("Grand Total"));
  assert(summary.includes("<f>SUM(G3:G3)</f><v>210</v>"));
  const empty = unzip(buildOrderReportXlsx({ rows: [], stateSummary: [] } as unknown as OrderReport));
  assert(empty.get("xl/worksheets/sheet2.xml")!.includes('autoFilter ref="A1:Z1"'));
  mkdirSync(resolve(".local/gst-export"), { recursive: true });
  writeFileSync(resolve(".local/gst-export/fixture.xlsx"), buildOrderReportXlsx(report));
  console.log("PASS: blank/partial columns, zero values, dates, postal codes, multi-item numbering, summary totals, empty report");

  if (process.argv.includes("--database")) {
    const require = createRequire(resolve("backend/package.json"));
    require("dotenv").config({ path: resolve("backend/.env"), quiet: true });
    const mongoose = require("mongoose");
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
      const live = await buildOrderReport("1_month", true);
      const output = buildOrderReportXlsx(live);
      writeFileSync(resolve(".local/gst-export/current.xlsx"), output);
      const contents = unzip(output);
      assert(contents.get("xl/workbook.xml")!.includes('name="Summary"'));
      assert(contents.get("xl/workbook.xml")!.includes('name="All Data"'));
      assert.equal((contents.get("xl/worksheets/sheet2.xml")!.match(/<row /g) || []).length, live.rows.length + 1);
      console.log(JSON.stringify({ liveOrders: live.summary.totalOrders, detailRows: live.rows.length, stateSheets: live.stateSummary.length, bytes: output.length }));
    } finally {
      await mongoose.disconnect();
    }
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
