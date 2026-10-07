import type { Request, Response } from "express";
import { buildOrderReport, normalizeReportPeriod } from "../services/order-report.service";
import {
  buildOrderReportCsv,
  buildOrderReportPdf,
  buildOrderReportXlsx,
  buildOrderReportXml,
} from "../services/order-report-export.service";

function periodFilename(value: string) {
  return value.replace(/_/g, "-");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function getAdminOrderReport(req: Request, res: Response) {
  try {
    const period = normalizeReportPeriod(req.query.period || "1_month");
    const report = await buildOrderReport(period, false);
    res.setHeader("Cache-Control", "no-store");
    return res.json({ success: true, report });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to load order report." });
  }
}

export async function exportAdminOrderReport(req: Request, res: Response) {
  try {
    const period = normalizeReportPeriod(req.query.period || "1_month");
    const format = String(req.query.format || "").trim().toLowerCase();
    if (!["pdf", "csv", "xlsx", "xml"].includes(format)) {
      return res.status(400).json({ success: false, message: "Invalid export format. Use pdf, csv, xlsx or xml." });
    }

    const report = await buildOrderReport(period, true);
    const builders: Record<string, () => Buffer> = {
      pdf: () => buildOrderReportPdf(report),
      csv: () => buildOrderReportCsv(report),
      xlsx: () => buildOrderReportXlsx(report),
      xml: () => buildOrderReportXml(report),
    };
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      csv: "text/csv; charset=utf-8",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xml: "application/xml; charset=utf-8",
    };
    const buffer = builders[format]();
    const filename = `hivrasoft-orders-report-${periodFilename(period)}-${today()}.${format}`;

    res.setHeader("Content-Type", contentTypes[format]);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to export order report." });
  }
}
