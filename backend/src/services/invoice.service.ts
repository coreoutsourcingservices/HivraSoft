import { loadPdfLogo, type PdfLogo } from "./brand-logo";

type InvoiceOrder = Record<string, any>;

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 34;

function ascii(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function amount(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(value: unknown) {
  return `INR ${amount(value).toFixed(2)}`;
}

function date(value: unknown) {
  const d = new Date(String(value || ""));
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB");
}

function textCmd(
  x: number,
  y: number,
  value: unknown,
  size = 10,
  bold = false
) {
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${ascii(value)}) Tj ET\n`;
}

function lineCmd(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width = 0.5
) {
  return `${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;
}

function rectCmd(
  x: number,
  y: number,
  w: number,
  h: number,
  gray = 0.96
) {
  return `q ${gray} g ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q\n`;
}

function imageCmd(x: number, y: number, w: number, h: number) {
  return `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Logo Do Q\n`;
}

function firstImage(order: InvoiceOrder) {
  const item = Array.isArray(order.items) ? order.items[0] : null;
  return String(item?.image || item?.imageUrl || "");
}

function companyLines() {
  const fromEnv = String(process.env.INVOICE_COMPANY_ADDRESS || "").trim();
  if (fromEnv) {
    return fromEnv
      .split("|")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [
    "E 2, Sector 63",
    "I.R3, Basement",
    "GAUTAM BUDDHA NAGAR-201301",
    "IN",
  ];
}

function addressLines(address: any) {
  if (!address || typeof address !== "object") return ["-"];

  return [
    address.fullName,
    [address.homeNumber, address.officeNumber, address.addressLine1]
      .filter(Boolean)
      .join(" "),
    address.addressLine2,
    [address.landmark, address.city, address.district]
      .filter(Boolean)
      .join(", "),
    [address.state, address.postalCode].filter(Boolean).join(" - "),
    address.country,
    address.phone ? `Phone: ${address.phone}` : "",
  ]
    .filter(Boolean)
    .map(String);
}

function orderCustomer(order: InvoiceOrder) {
  const customer =
    order.customer && typeof order.customer === "object" ? order.customer : {};
  const address =
    order.shippingAddress && typeof order.shippingAddress === "object"
      ? order.shippingAddress
      : {};

  return {
    name: String(customer.name || address.fullName || "Customer"),
    email: String(customer.email || ""),
    phone: String(customer.phone || address.phone || ""),
  };
}

function splitIdentifier(value: unknown, maxLength = 20) {
  const raw = String(value || "-").trim();
  if (raw.length <= maxLength) return [raw];

  const lastDash = raw.lastIndexOf("-");
  if (lastDash > 7 && lastDash < raw.length - 1) {
    return [raw.slice(0, lastDash), raw.slice(lastDash + 1)];
  }

  return [raw.slice(0, maxLength), raw.slice(maxLength)];
}

function buildInvoicePage(
  order: InvoiceOrder,
  items: any[],
  pageIndex: number,
  pageCount: number,
  logo: PdfLogo
) {
  let out = "";
  const customer = orderCustomer(order);
  const companyName = String(process.env.INVOICE_COMPANY_NAME || "Hivra Soft");
  const company = companyLines();

  out += "0 G 0 g\n";
  out += `1 w ${MARGIN} ${MARGIN} ${(PAGE_W - MARGIN * 2).toFixed(2)} ${(PAGE_H - MARGIN * 2).toFixed(2)} re S\n`;

  const logoWidth = Math.min(145, 58 * logo.width / logo.height);
  const logoHeight = logoWidth * logo.height / logo.width;
  out += imageCmd(MARGIN + 16, 804 - logoHeight, logoWidth, logoHeight);

  out += textCmd(360, 792, companyName, 13, true);
  company.slice(0, 4).forEach((line, index) => {
    out += textCmd(360, 777 - index * 12, line, 9.2, false);
  });

  out += textCmd(MARGIN + 16, 724, "TAX INVOICE", 17, true);
  out += textCmd(MARGIN + 16, 707, "Invoice:", 8.5, true);

  const invoiceLines = splitIdentifier(
    order.invoiceNumber || order.orderNumber || order._id || "-",
    21
  );
  invoiceLines.slice(0, 2).forEach((line, index) => {
    out += textCmd(MARGIN + 16, 694 - index * 11, line, 8.2);
  });

  if (pageCount > 1) {
    out += textCmd(
      MARGIN + 16,
      invoiceLines.length > 1 ? 668 : 680,
      `Page ${pageIndex + 1} of ${pageCount}`,
      7.5
    );
  }

  out += rectCmd(MARGIN, 562, PAGE_W - MARGIN * 2, 116, 0.96);
  out += textCmd(MARGIN + 16, 658, "Billing / Shipping", 11, true);

  const addr = addressLines(order.shippingAddress);
  addr.slice(0, 7).forEach((line, index) => {
    out += textCmd(MARGIN + 16, 642 - index * 13, line, 8.7);
  });

  if (customer.email) {
    out += textCmd(MARGIN + 16, 552, `Email: ${customer.email}`, 8);
  }

  const rx = 368;
  const valueX = rx + 88;
  out += textCmd(rx, 658, "Order / Payment", 11, true);

  let rightY = 641;
  const orderNumberLines = splitIdentifier(order.orderNumber || order._id, 20);

  out += textCmd(rx, rightY, "Order Number:", 8.2, true);
  orderNumberLines.slice(0, 2).forEach((line, index) => {
    out += textCmd(valueX, rightY - index * 11, line, 8.2);
  });
  rightY -= orderNumberLines.length > 1 ? 26 : 15;

  out += textCmd(rx, rightY, "Order Date:", 8.2, true);
  out += textCmd(valueX, rightY, date(order.createdAt), 8.2);
  rightY -= 15;

  out += textCmd(rx, rightY, "Payment Method:", 8.2, true);
  out += textCmd(
    valueX,
    rightY,
    String(order.paymentMethod || "").toUpperCase(),
    8.2
  );
  rightY -= 15;

  out += textCmd(rx, rightY, "Order Status:", 8.2, true);
  out += textCmd(
    valueX,
    rightY,
    String(order.status || "").replaceAll("_", " ").toUpperCase(),
    8.2
  );

  const payment =
    order.payment && typeof order.payment === "object" ? order.payment : {};
  const transaction = String(
    payment.razorpayPaymentId || payment.transactionId || ""
  ).trim();

  if (transaction) {
    rightY -= 15;
    out += textCmd(rx, rightY, "Transaction:", 8.2, true);
    splitIdentifier(transaction, 20)
      .slice(0, 2)
      .forEach((line, index) => {
        out += textCmd(valueX, rightY - index * 11, line, 8.2);
      });
  }

  const tableTop = 530;
  out += textCmd(MARGIN + 16, tableTop, "Item", 9.5, true);
  out += textCmd(315, tableTop, "Unit", 9.5, true);
  out += textCmd(385, tableTop, "Qty", 9.5, true);
  out += textCmd(438, tableTop, "Discount", 9.5, true);
  out += textCmd(515, tableTop, "Total", 9.5, true);
  out += lineCmd(
    MARGIN + 14,
    tableTop - 8,
    PAGE_W - MARGIN - 14,
    tableTop - 8,
    0.5
  );

  let y = tableTop - 28;

  for (const item of items) {
    const variant = [item.colorName || item.color, item.sizeName || item.size]
      .filter(Boolean)
      .join(" / ");
    const name = String(item.name || item.productName || "Product");
    const display = variant ? `${name} - ${variant}` : name;
    const q = amount(item.quantity);
    const unit = amount(item.unitPrice ?? item.price ?? item.finalUnitPrice);
    const discount = amount(item.discount ?? item.totalDiscount);
    const total = amount(
      item.finalTotal ?? item.lineTotal ?? item.subtotal ?? unit * q
    );

    out += textCmd(MARGIN + 16, y, display.slice(0, 47), 8.2, true);
    out += textCmd(315, y, money(unit), 8);
    out += textCmd(390, y, `x ${q}`, 8);
    out += textCmd(438, y, money(discount), 8);
    out += textCmd(515, y, money(total), 8);

    y -= 25;
    out += lineCmd(
      MARGIN + 14,
      y + 10,
      PAGE_W - MARGIN - 14,
      y + 10,
      0.25
    );
  }

  if (pageIndex === pageCount - 1) {
    const summaryRows: Array<[string, string, boolean]> = [
      ["Items Subtotal", money(order.subtotal), false],
    ];

    const automaticDiscount = amount(order.automaticDiscount);
    const couponDiscount = amount(order.codeDiscount);
    const taxAmount = amount(order.tax);
    const taxPercentage = amount(order.taxPercentage);
    const taxDetails = order.taxDetails && typeof order.taxDetails === "object" ? order.taxDetails : {};
    const taxValueType = String(taxDetails.valueType || "percentage").toLowerCase();
    const deliveryCharge =
      order.deliveryCharge && typeof order.deliveryCharge === "object"
        ? order.deliveryCharge
        : {};
    const shipping = Math.max(
      amount(order.shipping ?? order.shippingCharge),
      amount(deliveryCharge.charge)
    );
    const paymentMethod = String(order.paymentMethod || "").toLowerCase();
    const deliveryLabel =
      paymentMethod === "cod"
        ? "COD Charge"
        : paymentMethod === "online" || paymentMethod === "razorpay"
          ? "Online Delivery Charge"
          : "Delivery Charge";
    const showDeliveryCharge =
      shipping > 0 ||
      paymentMethod === "cod" ||
      paymentMethod === "online" ||
      paymentMethod === "razorpay";

    if (automaticDiscount > 0) {
      summaryRows.push([
        "Automatic Discount",
        `- ${money(automaticDiscount)}`,
        false,
      ]);
    }

    if (couponDiscount > 0) {
      summaryRows.push([
        "Coupon Discount",
        `- ${money(couponDiscount)}`,
        false,
      ]);
    }

    if (taxAmount > 0) {
      const taxLabel = `${order.taxName || "Tax"}${
        taxValueType === "fixed" ? " (Custom Price)" : taxPercentage > 0 ? ` (${taxPercentage}%)` : ""
      }`;
      summaryRows.push([taxLabel, money(taxAmount), false]);
    }

    if (showDeliveryCharge) {
      summaryRows.push([deliveryLabel, money(shipping), false]);
    }

    summaryRows.push(["Order Total", money(order.total), true]);

    const rowHeight = 17;
    const summaryHeight = summaryRows.length * rowHeight;
    const summaryTop = Math.max(145, y - 35);

    out += lineCmd(
      300,
      summaryTop + 18,
      PAGE_W - MARGIN - 14,
      summaryTop + 18,
      1.2
    );

    summaryRows.forEach(([label, value, isTotal], index) => {
      const rowY = summaryTop - index * rowHeight;
      out += textCmd(350, rowY, `${label}:`, isTotal ? 10 : 8.5, true);
      out += textCmd(500, rowY, value, isTotal ? 10 : 8.5, isTotal);
    });

    out += lineCmd(
      300,
      summaryTop - summaryHeight + 7,
      PAGE_W - MARGIN - 14,
      summaryTop - summaryHeight + 7,
      1.2
    );

    out += textCmd(
      MARGIN + 16,
      78,
      "Thank you for shopping with Hivra Soft.",
      8.5
    );

    if (firstImage(order)) {
      out += textCmd(
        MARGIN + 16,
        63,
        "Product image is stored with the order snapshot for audit/history.",
        7.5
      );
    }
  }

  return out;
}

function makePdf(pageStreams: string[], logo: PdfLogo) {
  const objects: Buffer[] = [];

  const push = (content: string | Buffer) => {
    objects.push(Buffer.isBuffer(content) ? content : Buffer.from(content, "latin1"));
    return objects.length;
  };

  const catalogId = push("");
  const pagesId = push("");
  const fontRegularId = push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  );
  const fontBoldId = push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
  );

  let logoId: number | null = null;

  if (logo) {
    const maskId = push(Buffer.concat([
      Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${logo.alpha.length} >>\nstream\n`, "latin1"),
      logo.alpha, Buffer.from("\nendstream", "latin1"),
    ]));
    logoId = push(
      Buffer.concat([
        Buffer.from(
          `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /SMask ${maskId} 0 R /Length ${logo.rgb.length} >>\nstream\n`,
          "latin1"
        ),
        logo.rgb,
        Buffer.from("\nendstream", "latin1"),
      ])
    );
  }

  const pageIds: number[] = [];

  for (const stream of pageStreams) {
    const content = Buffer.from(stream, "latin1");
    const contentId = push(
      Buffer.concat([
        Buffer.from(`<< /Length ${content.length} >>\nstream\n`, "latin1"),
        content,
        Buffer.from("\nendstream", "latin1"),
      ])
    );

    const pageId = push("");
    pageIds.push(pageId);

    const xObjectResources = logoId
      ? `/XObject << /Logo ${logoId} 0 R >> `
      : "";

    objects[pageId - 1] = Buffer.from(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> ${xObjectResources}>> /Contents ${contentId} 0 R >>`,
      "latin1"
    );
  }

  objects[catalogId - 1] = Buffer.from(
    `<< /Type /Catalog /Pages ${pagesId} 0 R >>`,
    "latin1"
  );

  objects[pagesId - 1] = Buffer.from(
    `<< /Type /Pages /Kids [${pageIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${pageIds.length} >>`,
    "latin1"
  );

  const chunks: Buffer[] = [
    Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1"),
  ];
  const offsets = [0];
  let length = chunks[0].length;

  objects.forEach((obj, index) => {
    offsets[index + 1] = length;

    const wrapped = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`, "latin1"),
      obj,
      Buffer.from("\nendobj\n", "latin1"),
    ]);

    chunks.push(wrapped);
    length += wrapped.length;
  });

  const xrefOffset = length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  xref += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(Buffer.from(xref, "latin1"));

  return Buffer.concat(chunks);
}

export function buildInvoicePdf(order: InvoiceOrder) {
  return buildInvoicesPdf([order]);
}

export function buildInvoicesPdf(orders: InvoiceOrder[]) {
  const streams: string[] = [];
  const logo = loadPdfLogo();

  for (const order of orders) {
    const items = Array.isArray(order.items) ? order.items : [];
    const chunks = items.length
      ? Array.from({ length: Math.ceil(items.length / 12) }, (_, i) =>
          items.slice(i * 12, i * 12 + 12)
        )
      : [[]];

    chunks.forEach((itemChunk, index) => {
      streams.push(
        buildInvoicePage(order, itemChunk, index, chunks.length, logo)
      );
    });
  }

  return makePdf(
    streams.length
      ? streams
      : [textCmd(50, 780, "No invoices selected.", 12, true)],
    logo
  );
}
