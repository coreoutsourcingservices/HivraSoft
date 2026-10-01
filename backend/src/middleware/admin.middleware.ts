import {
  Request,
  Response,
  NextFunction,
} from "express";

const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res
      .status(401)
      .json({
        success: false,
        message:
          "Not authenticated.",
      });
  }

  if (
    req.user.role !==
      "admin" &&
    req.user.role !==
      "super_admin"
  ) {
    return res
      .status(403)
      .json({
        success: false,
        message:
          "Admin access required.",
      });
  }

  return next();
};

export {
  requireAdmin,
};

export default requireAdmin;