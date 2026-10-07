import { deflateRawSync } from "node:zlib";
import type { NormalizedOrderRow, OrderReport } from "./order-report.service";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function money(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round((n + Number.EPSILON) * 100) / 100 : 0;
}

function dateIso(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function dateTimeText(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

const DETAIL_HEADERS = [
  "Order Number", "Invoice Number", "Order Status", "Order Date", "Customer Name", "Customer Email", "Phone",
  "Billing Address", "Billing City", "Billing State", "Billing State Code", "Billing Postcode", "Billing Country",
  "Shipping Address", "Shipping City", "Shipping State", "Shipping State Code", "Shipping Postcode", "Shipping Country",
  "Payment Method", "Payment Status", "Subtotal", "Discount", "Shipping", "Refund", "Tax", "Order Total",
  "Coupon Code", "SKU", "Item Number", "Item Name", "Quantity", "Item Cost", "Item Discount",
];

function detailValues(row: NormalizedOrderRow): Array<string | number> {
  return [
    row.orderNumber, row.invoiceNumber, row.orderStatus, dateIso(row.orderDate), row.customerName, row.customerEmail, row.customerPhone,
    row.billingAddress, row.billingCity, row.billingState, row.billingStateCode, row.billingPostcode, row.billingCountry,
    row.shippingAddress, row.shippingCity, row.shippingState, row.shippingStateCode, row.shippingPostcode, row.shippingCountry,
    row.paymentMethod, row.paymentStatus, row.subtotal, row.discount, row.shipping, row.refund, row.tax, row.total,
    row.couponCode, row.sku, row.itemNumber, row.itemName, row.quantity, row.itemCost, row.itemDiscount,
  ];
}

export function buildOrderReportCsv(report: OrderReport) {
  const lines = [DETAIL_HEADERS.map(csvCell).join(",")];
  for (const row of report.rows) lines.push(detailValues(row).map(csvCell).join(","));
  return Buffer.from(`\uFEFF${lines.join("\r\n")}`, "utf8");
}

export function buildOrderReportXml(report: OrderReport) {
  const range = report.range;
  const s = report.summary;
  const orderMap = new Map<string, NormalizedOrderRow[]>();
  for (const row of report.rows) {
    const rows = orderMap.get(row.orderId) || [];
    rows.push(row);
    orderMap.set(row.orderId, rows);
  }

  const orders = [...orderMap.values()].map((rows) => {
    const first = rows[0];
    const items = rows.map((row) => `
        <item>
          <sku>${esc(row.sku)}</sku>
          <itemNumber>${esc(row.itemNumber)}</itemNumber>
          <name>${esc(row.itemName)}</name>
          <quantity>${row.quantity}</quantity>
          <price>${money(row.itemCost).toFixed(2)}</price>
          <discount>${money(row.itemDiscount).toFixed(2)}</discount>
        </item>`).join("");
    return `
    <order>
      <orderNumber>${esc(first.orderNumber)}</orderNumber>
      <invoiceNumber>${esc(first.invoiceNumber)}</invoiceNumber>
      <orderDate>${dateIso(first.orderDate)}</orderDate>
      <customer><name>${esc(first.customerName)}</name><email>${esc(first.customerEmail)}</email><phone>${esc(first.customerPhone)}</phone></customer>
      <shipping><address>${esc(first.shippingAddress)}</address><city>${esc(first.shippingCity)}</city><state>${esc(first.shippingState)}</state><stateCode>${esc(first.shippingStateCode)}</stateCode><postcode>${esc(first.shippingPostcode)}</postcode><country>${esc(first.shippingCountry)}</country></shipping>
      <payment><method>${esc(first.paymentMethod)}</method><status>${esc(first.paymentStatus)}</status></payment>
      <items>${items}
      </items>
      <totals><subtotal>${money(first.subtotal).toFixed(2)}</subtotal><discount>${money(first.discount).toFixed(2)}</discount><shipping>${money(first.shipping).toFixed(2)}</shipping><refund>${money(first.refund).toFixed(2)}</refund><tax>${money(first.tax).toFixed(2)}</tax><total>${money(first.total).toFixed(2)}</total></totals>
      <orderStatus>${esc(first.orderStatus)}</orderStatus>
    </order>`;
  }).join("");

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<hivrasoftOrderReport>
  <report><period>${esc(range.period)}</period><startDate>${dateIso(range.start)}</startDate><endDate>${dateIso(range.end)}</endDate><generatedAt>${new Date().toISOString()}</generatedAt></report>
  <summary><totalOrders>${s.totalOrders}</totalOrders><completedOrders>${s.completedOrders}</completedOrders><cancelledOrders>${s.cancelledOrders}</cancelledOrders><totalSales>${money(s.totalSales).toFixed(2)}</totalSales><grossSales>${money(s.grossSales).toFixed(2)}</grossSales><discount>${money(s.discounts).toFixed(2)}</discount><refund>${money(s.refunds).toFixed(2)}</refund><shipping>${money(s.shipping).toFixed(2)}</shipping><tax>${money(s.taxes).toFixed(2)}</tax><netSales>${money(s.netSales).toFixed(2)}</netSales></summary>
  <states>${report.stateSummary.map((row) => `<state><code>${esc(row.stateCode)}</code><name>${esc(row.state)}</name><orders>${row.orders}</orders><quantity>${row.quantity}</quantity><subtotal>${money(row.subtotal).toFixed(2)}</subtotal><discount>${money(row.discount).toFixed(2)}</discount><tax>${money(row.tax).toFixed(2)}</tax><total>${money(row.total).toFixed(2)}</total></state>`).join("")}</states>
  <orders>${orders}
  </orders>
</hivrasoftOrderReport>`, "utf8");
}

// ---------------- XLSX (dependency-free OOXML) ----------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function zipFiles(files: Array<{ name: string; data: Buffer | string }>) {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const raw = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, "utf8");
    const compressed = deflateRawSync(raw, { level: 6 });
    const crc = crc32(raw);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, compressed);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += local.length + compressed.length;
  }

  const centralSize = centrals.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16); end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, ...centrals, end]);
}

function colName(index: number) {
  let n = index + 1;
  let out = "";
  while (n > 0) { const r = (n - 1) % 26; out = String.fromCharCode(65 + r) + out; n = Math.floor((n - 1) / 26); }
  return out;
}

function xlsxCell(value: string | number, row: number, col: number, style = 0) {
  const ref = `${colName(col)}${row}`;
  if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

function sheetXml(title: string, subtitle: string, headers: string[], rows: Array<Array<string | number>>, moneyColumns: Set<number>, widths?: number[]) {
  const maxCol = Math.max(headers.length, 1);
  const cols = Array.from({ length: maxCol }, (_, i) => `<col min="${i + 1}" max="${i + 1}" width="${widths?.[i] || Math.min(38, Math.max(12, headers[i]?.length || 12) + 2)}" customWidth="1"/>`).join("");
  const rowXml: string[] = [];
  rowXml.push(`<row r="1" ht="24" customHeight="1">${xlsxCell(title, 1, 0, 3)}</row>`);
  rowXml.push(`<row r="2">${xlsxCell(subtitle, 2, 0, 4)}</row>`);
  rowXml.push(`<row r="3">${xlsxCell(`Generated: ${dateTimeText(new Date())}`, 3, 0, 4)}</row>`);
  rowXml.push(`<row r="5">${headers.map((header, i) => xlsxCell(header, 5, i, 1)).join("")}</row>`);
  rows.forEach((values, rIndex) => {
    const excelRow = rIndex + 6;
    rowXml.push(`<row r="${excelRow}">${values.map((value, cIndex) => xlsxCell(value, excelRow, cIndex, moneyColumns.has(cIndex) ? 2 : 0)).join("")}</row>`);
  });
  const lastRow = Math.max(5, rows.length + 5);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${cols}</cols><sheetData>${rowXml.join("")}</sheetData>
  <autoFilter ref="A5:${colName(maxCol - 1)}${lastRow}"/>
  <mergeCells count="1"><mergeCell ref="A1:${colName(Math.min(maxCol - 1, 7))}1"/></mergeCells>
</worksheet>`;
}

function safeSheetName(value: string, used: Set<string>) {
  const base = (value || "State").replace(/[\\/*?:\[\]]/g, " ").trim().slice(0, 31) || "State";
  let name = base;
  let index = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = ` ${index++}`;
    name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  }
  used.add(name.toLowerCase());
  return name;
}

export function buildOrderReportXlsx(report: OrderReport) {
  const subtitle = `Period: ${report.range.label} (${dateIso(report.range.start) || "Beginning"} to ${dateIso(report.range.end)})`;
  const summaryHeaders = ["State Code", "State", "Orders", "Qty", "Order Subtotal Amount", "Cart Discount Amount", "Order Total Amount", "Order Total Tax Amount"];
  const summaryRows = report.stateSummary.map((row) => [row.stateCode, row.state, row.orders, row.quantity, row.subtotal, row.discount, row.total, row.tax]);
  const detailRows = report.rows.map(detailValues);
  const detailMoney = new Set([21, 22, 23, 24, 25, 26, 32, 33]);
  const sheets: Array<{ name: string; xml: string }> = [];
  const used = new Set<string>();
  sheets.push({ name: safeSheetName("Summary", used), xml: sheetXml("HivraSoft Order & Sales Report - State Summary", subtitle, summaryHeaders, summaryRows, new Set([4, 5, 6, 7]), [12, 24, 10, 10, 22, 22, 20, 20]) });
  sheets.push({ name: safeSheetName("All Data", used), xml: sheetXml("HivraSoft Order & Sales Report - All Data", subtitle, DETAIL_HEADERS, detailRows, detailMoney) });

  for (const state of report.stateSummary) {
    const stateRows = report.rows.filter((row) => (row.shippingState || row.billingState || "Unknown").trim().toLowerCase() === state.state.trim().toLowerCase()).map(detailValues);
    if (!stateRows.length) continue;
    sheets.push({ name: safeSheetName(state.state || "Unknown", used), xml: sheetXml(`HivraSoft Orders - ${state.state}`, subtitle, DETAIL_HEADERS, stateRows, detailMoney) });
  }

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, i) => `<sheet name="${esc(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="[$₹-en-IN]#,##0.00;[Red]-[$₹-en-IN]#,##0.00"/></numFmts><fonts count="3"><font><sz val="10"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FF8C1839"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF8C1839"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFE7DED8"/></left><right style="thin"><color rgb="FFE7DED8"/></right><top style="thin"><color rgb="FFE7DED8"/></top><bottom style="thin"><color rgb="FFE7DED8"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  const files: Array<{ name: string; data: string | Buffer }> = [
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: rootRels },
    { name: "xl/workbook.xml", data: workbook },
    { name: "xl/_rels/workbook.xml.rels", data: workbookRels },
    { name: "xl/styles.xml", data: styles },
    ...sheets.map((sheet, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheet.xml })),
  ];
  return zipFiles(files);
}

// ---------------- PDF ----------------
const PAGE_W = 841.89;
const PAGE_H = 595.28;
const M = 30;

function pdfAscii(value: unknown) {
  return String(value ?? "").normalize("NFKD").replace(/[^\x20-\x7E]/g, "?").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function text(x: number, y: number, value: unknown, size = 9, bold = false) { return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${pdfAscii(value)}) Tj ET\n`; }
function line(x1: number, y1: number, x2: number, y2: number, width = 0.4) { return `${width} w ${x1} ${y1} m ${x2} ${y2} l S\n`; }
function rect(x: number, y: number, w: number, h: number, gray = 0.96) { return `q ${gray} g ${x} ${y} ${w} ${h} re f Q\n`; }

function makePdf(streams: string[]) {
  const objects: Buffer[] = [];
  const push = (content: string | Buffer) => { objects.push(Buffer.isBuffer(content) ? content : Buffer.from(content, "latin1")); return objects.length; };
  const catalog = push(""); const pages = push("");
  const f1 = push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const f2 = push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds: number[] = [];
  for (const stream of streams) {
    const data = Buffer.from(stream, "latin1");
    const content = push(Buffer.concat([Buffer.from(`<< /Length ${data.length} >>\nstream\n`, "latin1"), data, Buffer.from("\nendstream", "latin1")]));
    const page = push(""); pageIds.push(page);
    objects[page - 1] = Buffer.from(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${content} 0 R >>`, "latin1");
  }
  objects[catalog - 1] = Buffer.from(`<< /Type /Catalog /Pages ${pages} 0 R >>`, "latin1");
  objects[pages - 1] = Buffer.from(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`, "latin1");
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")]; const offsets = [0]; let length = chunks[0].length;
  objects.forEach((obj, i) => { offsets[i + 1] = length; const wrapped = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`, "latin1"), obj, Buffer.from("\nendobj\n", "latin1")]); chunks.push(wrapped); length += wrapped.length; });
  const xrefOffset = length; let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(Buffer.from(xref, "latin1")); return Buffer.concat(chunks);
}

function pdfHeader(report: OrderReport, page: number, totalPages: number) {
  let out = "0 G 0 g\n";
  out += text(M, PAGE_H - 36, "HIVRASOFT", 17, true);
  out += text(M, PAGE_H - 55, "Order & Sales Report", 12, true);
  out += text(570, PAGE_H - 36, `Period: ${dateIso(report.range.start) || "Beginning"} - ${dateIso(report.range.end)}`, 8);
  out += text(570, PAGE_H - 50, `Generated: ${dateTimeText(new Date())}`, 8);
  out += line(M, PAGE_H - 66, PAGE_W - M, PAGE_H - 66, 0.8);
  out += text(M, 18, "Generated by HivraSoft Admin", 7);
  out += text(PAGE_W - 90, 18, `Page ${page} of ${totalPages}`, 7);
  return out;
}

export function buildOrderReportPdf(report: OrderReport) {
  const detailChunks = Array.from({ length: Math.max(1, Math.ceil(report.rows.length / 22)) }, (_, i) => report.rows.slice(i * 22, i * 22 + 22));
  const statePages = Math.max(1, Math.ceil(report.stateSummary.length / 24));
  const totalPages = 1 + statePages + detailChunks.length;
  const streams: string[] = [];

  let out = pdfHeader(report, 1, totalPages);
  const s = report.summary;
  out += rect(M, 430, PAGE_W - M * 2, 78, 0.96);
  const cards = [
    ["Total Sales", `INR ${money(s.totalSales).toFixed(2)}`], ["Total Orders", s.totalOrders], ["Completed", s.completedOrders], ["Cancelled", s.cancelledOrders],
    ["Gross Sales", `INR ${money(s.grossSales).toFixed(2)}`], ["Discount", `INR ${money(s.discounts).toFixed(2)}`], ["Tax", `INR ${money(s.taxes).toFixed(2)}`], ["Shipping", `INR ${money(s.shipping).toFixed(2)}`],
  ];
  cards.forEach(([label, value], i) => { const col = i % 4; const row = Math.floor(i / 4); const x = M + 18 + col * 195; const y = 485 - row * 36; out += text(x, y, label, 7.5); out += text(x, y - 16, value, 10, true); });
  out += text(M, 398, "Sales Breakdown", 11, true);
  const breakdown = [["Net Sales", s.netSales], ["Refund", s.refunds], ["Cancelled Value", s.cancelledValue], ["Total Sales", s.totalSales]];
  breakdown.forEach(([label, value], i) => { out += text(M + 10, 373 - i * 22, `${label}:`, 8.5, true); out += text(160, 373 - i * 22, `INR ${money(value).toFixed(2)}`, 8.5); });
  out += text(360, 398, "Top Selling States", 11, true);
  report.stateSummary.slice(0, 8).forEach((row, i) => { out += text(370, 375 - i * 20, `${row.state} (${row.stateCode || "-"})`, 8); out += text(600, 375 - i * 20, `${row.orders} orders`, 8); out += text(700, 375 - i * 20, `${row.percentage.toFixed(2)}%`, 8, true); });
  streams.push(out);

  for (let p = 0; p < statePages; p += 1) {
    out = pdfHeader(report, 2 + p, totalPages);
    out += text(M, PAGE_H - 90, "State-wise Summary", 12, true);
    const headers = ["Code", "State", "Orders", "Qty", "Subtotal", "Discount", "Tax", "Total"];
    const xs = [M, 80, 260, 325, 380, 490, 590, 675];
    out += rect(M, PAGE_H - 124, PAGE_W - M * 2, 22, 0.93);
    headers.forEach((h, i) => { out += text(xs[i], PAGE_H - 118, h, 7.5, true); });
    report.stateSummary.slice(p * 24, p * 24 + 24).forEach((row, i) => {
      const y = PAGE_H - 142 - i * 18;
      out += text(xs[0], y, row.stateCode || "-", 7); out += text(xs[1], y, row.state.slice(0, 26), 7); out += text(xs[2], y, row.orders, 7); out += text(xs[3], y, row.quantity, 7);
      out += text(xs[4], y, money(row.subtotal).toFixed(2), 7); out += text(xs[5], y, money(row.discount).toFixed(2), 7); out += text(xs[6], y, money(row.tax).toFixed(2), 7); out += text(xs[7], y, money(row.total).toFixed(2), 7);
      out += line(M, y - 5, PAGE_W - M, y - 5, 0.18);
    });
    streams.push(out);
  }

  detailChunks.forEach((rows, chunkIndex) => {
    const page = 2 + statePages + chunkIndex;
    out = pdfHeader(report, page, totalPages);
    out += text(M, PAGE_H - 90, "Detailed Orders", 12, true);
    const headers = ["Order", "Date", "Customer", "State", "Product", "Qty", "Subtotal", "Tax", "Total", "Status"];
    const xs = [M, 118, 174, 298, 382, 535, 570, 635, 680, 750];
    out += rect(M, PAGE_H - 124, PAGE_W - M * 2, 22, 0.93);
    headers.forEach((h, i) => { out += text(xs[i], PAGE_H - 118, h, 6.7, true); });
    rows.forEach((row, i) => {
      const y = PAGE_H - 142 - i * 20;
      out += text(xs[0], y, row.orderNumber.slice(0, 16), 6.5); out += text(xs[1], y, dateIso(row.orderDate).slice(5), 6.5); out += text(xs[2], y, row.customerName.slice(0, 19), 6.5); out += text(xs[3], y, (row.shippingState || row.billingState).slice(0, 13), 6.5); out += text(xs[4], y, row.itemName.slice(0, 23), 6.5); out += text(xs[5], y, row.quantity, 6.5);
      out += text(xs[6], y, money(row.subtotal).toFixed(0), 6.5); out += text(xs[7], y, money(row.tax).toFixed(0), 6.5); out += text(xs[8], y, money(row.total).toFixed(0), 6.5); out += text(xs[9], y, row.orderStatus.slice(0, 12), 6.5);
      out += line(M, y - 5, PAGE_W - M, y - 5, 0.15);
    });
    if (!rows.length) out += text(M, PAGE_H - 160, "No order data available for this period.", 9);
    streams.push(out);
  });
  return makePdf(streams);
}
