import type { Request, Response } from "express";
import { globalSearch } from "../services/search.service";

/* =========================================================
   GLOBAL SEARCH - PUBLIC

   GET /api/search?q=black&category=panty&page=1&limit=24
========================================================= */

export const globalSearchController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await globalSearch({
      q: String(req.query.q || ""),
      category: String(req.query.category || ""),
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 24),
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GLOBAL SEARCH ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to search products.",
    });
  }
};
