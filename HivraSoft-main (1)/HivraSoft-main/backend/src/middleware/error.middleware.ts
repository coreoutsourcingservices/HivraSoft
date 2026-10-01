import {
  NextFunction,
  Request,
  Response,
} from "express";

import multer from "multer";

const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(error);

  if (
    error instanceof
    multer.MulterError
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          error.message,
      });
  }

  if (
    error.message.includes(
      "Only JPG"
    ) ||
    error.message.includes(
      "Only MP4"
    ) ||
    error.message.includes(
      "Invalid banner upload field"
    )
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          error.message,
      });
  }

  return res
    .status(500)
    .json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
};

export default errorMiddleware;
