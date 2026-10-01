import type { Request, Response } from "express";
import { listCommerceTracking } from "../services/commerce-tracking.service";

async function respond(kind: "cart" | "wishlist", req: Request, res: Response) {
  try {
    const result = await listCommerceTracking(kind, req.query);
    return res.status(200).json({
      success: true,
      tracking: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error(`ADMIN ${kind.toUpperCase()} TRACKING ERROR:`, error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : `Unable to load ${kind} tracking.`,
    });
  }
}

export const getAdminCartTracking = (req: Request, res: Response) => respond("cart", req, res);
export const getAdminWishlistTracking = (req: Request, res: Response) => respond("wishlist", req, res);
