import {
  Request,
  Response,
  NextFunction,
} from "express";

import User from "../models/User.model";
import { verifyToken } from "../utils/jwt";

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authorization = String(req.headers.authorization || "");
    const bearerToken = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
    const token = req.cookies?.accessToken || bearerToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message:
          "Not authenticated",
      });

      return;
    }

    const decoded =
      verifyToken(token);

    if (!decoded?.id) {
      res.status(401).json({
        success: false,
        message:
          "Invalid session",
      });

      return;
    }

    const user =
      await User.findById(
        decoded.id
      );

    if (!user) {
      res.status(401).json({
        success: false,
        message:
          "User not found",
      });

      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message:
          "Account is disabled",
      });

      return;
    }

    req.user = user;

    if (user.role === "customer") {
      const last = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
      if (!last || Date.now() - last > 5 * 60 * 1000) {
        void User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } }).catch(() => undefined);
      }
    }

    next();
  } catch (error) {
    console.error(
      "AUTH ERROR:",
      error
    );

    res.status(401).json({
      success: false,
      message:
        "Invalid or expired session",
    });

    return;
  }
};

export const protect =
  authenticate;

export {
  authenticate,
};

export default authenticate;