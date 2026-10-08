import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
  registerSendOtp,
  registerVerifyOtp,
  loginSendOtp,
  loginVerifyOtp,
  getMe,
  logout,
   getAccountInfo,
  updateAccountInfo,
} from "../controllers/auth.controller";

import {
  authenticate,
} from "../middleware/auth.middleware";

const router = Router();

/* =========================================================
   OTP RATE LIMITER
========================================================= */

const otpSendLimiter = rateLimit({
 

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many OTP requests. Please try again after some time.",
  },
});

/* =========================================================
   REGISTER
========================================================= */

router.post(
  "/register/send-otp",
  otpSendLimiter,
  registerSendOtp
);

router.post(
  "/register/verify-otp",
  registerVerifyOtp
);

/* =========================================================
   LOGIN
========================================================= */

router.post(
  "/login/send-otp",
  otpSendLimiter,
  loginSendOtp
);

router.post(
  "/login/verify-otp",
  loginVerifyOtp
);

/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  "/me",
  authenticate,
  getMe
);
/* =========================================================
   ACCOUNT
========================================================= */

/* GET ACCOUNT */

router.get(
  "/account",
  authenticate,
  getAccountInfo
);

/* UPDATE ACCOUNT */

router.patch(
  "/account",
  authenticate,
  updateAccountInfo
);

/* =========================================================
   LOGOUT
========================================================= */

router.post(
  "/logout",
  logout
);

export default router;