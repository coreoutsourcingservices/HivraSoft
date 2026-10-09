import crypto from "crypto";

import User from "../models/User.model";
import Otp from "../models/Otp.model";

import {
  sendOtpEmail,
} from "./mail.service";

import {
  generateToken,
} from "../utils/jwt";

const OTP_EXPIRY_MINUTES =
  Number(
    process.env
      .OTP_EXPIRES_MINUTES || 5
  );

const OTP_RESEND_SECONDS =
  Number(
    process.env
      .OTP_RESEND_SECONDS || 60
  );

const MAX_OTP_ATTEMPTS = 5;


/* ========================================
   HELPERS
======================================== */

const normalizeEmail = (
  email: string
): string => {
  return email
    .trim()
    .toLowerCase();
};


const generateOtp = (): string => {
  return crypto
    .randomInt(
      100000,
      1000000
    )
    .toString();
};


const hashOtp = (
  email: string,
  otp: string
): string => {
  const secret =
    process.env.OTP_HASH_SECRET;

  if (!secret) {
    throw new Error(
      "OTP_HASH_SECRET missing in .env"
    );
  }

  return crypto
    .createHmac(
      "sha256",
      secret
    )
    .update(
      `${email}:${otp}`
    )
    .digest("hex");
};


const checkResendCooldown =
  async (
    email: string,
    purpose:
      | "register"
      | "login"
  ) => {
    const existing =
      await Otp.findOne({
        email,
        purpose,
      });

    if (!existing) {
      return;
    }

    const elapsed =
      Date.now() -
      existing.updatedAt.getTime();

    const waitMs =
      OTP_RESEND_SECONDS *
      1000;

    if (elapsed < waitMs) {
      const secondsLeft =
        Math.ceil(
          (
            waitMs -
            elapsed
          ) / 1000
        );

      throw new Error(
        `Please wait ${secondsLeft} seconds before requesting another OTP.`
      );
    }
  };


/* ========================================
   REGISTER — SEND OTP
======================================== */

export const sendRegisterOtp =
  async (
    emailInput: string
  ) => {
    const email =
      normalizeEmail(
        emailInput
      );

    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      throw new Error(
        "Account already exists. Please login."
      );
    }

    await checkResendCooldown(
      email,
      "register"
    );

    const otp =
      generateOtp();

    const otpHash =
      hashOtp(
        email,
        otp
      );

    const expiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRY_MINUTES *
            60 *
            1000
      );

    await Otp.findOneAndUpdate(
      {
        email,
        purpose:
          "register",
      },
      {
        otpHash,
        purpose:
          "register",
        attempts: 0,
        expiresAt,
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert:
          true,
      }
    );

    await sendOtpEmail(
      email,
      otp
    );

    return {
      message:
        "OTP sent successfully",
    };
  };


/* ========================================
   REGISTER — VERIFY OTP
======================================== */

export const verifyRegisterOtp =
  async ({
    name,
    email: emailInput,
    phone,
    otp,
  }: {
    name: string;
    email: string;
    phone: string;
    otp: string;
  }) => {
    const email =
      normalizeEmail(
        emailInput
      );

    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      throw new Error(
        "Account already exists."
      );
    }

    const otpRecord =
      await Otp.findOne({
        email,
        purpose:
          "register",
      });

    if (!otpRecord) {
      throw new Error(
        "OTP expired or invalid."
      );
    }

    if (
      otpRecord
        .expiresAt
        .getTime() <
      Date.now()
    ) {
      await Otp.deleteOne({
        _id:
          otpRecord._id,
      });

      throw new Error(
        "OTP has expired. Please request a new OTP."
      );
    }

    if (
      otpRecord.attempts >=
      MAX_OTP_ATTEMPTS
    ) {
      await Otp.deleteOne({
        _id:
          otpRecord._id,
      });

      throw new Error(
        "Too many incorrect attempts. Please request a new OTP."
      );
    }

    const receivedHash =
      hashOtp(
        email,
        otp
      );

    if (
      receivedHash !==
      otpRecord.otpHash
    ) {
      otpRecord.attempts +=
        1;

      await otpRecord.save();

      throw new Error(
        "Incorrect OTP."
      );
    }

    const cleanPhone =
      phone.replace(
        /\D/g,
        ""
      );

    if (
      cleanPhone.length !==
      10
    ) {
      throw new Error(
        "Please enter a valid 10 digit phone number."
      );
    }

    const user =
      await User.create({
        name:
          name.trim(),

        email,

        phone:
          cleanPhone,

        role:
          "customer",

        emailVerified:
          true,

        isActive:
          true,
      });

    await Otp.deleteOne({
      _id:
        otpRecord._id,
    });

    const token =
      generateToken(
        String(
          user._id
        ),
        user.role
      );

    return {
      user,
      token,
    };
  };


/* ========================================
   LOGIN — SEND OTP
======================================== */

export const sendLoginOtp =
  async (
    emailInput: string
  ) => {
    const email =
      normalizeEmail(
        emailInput
      );

    const user =
      await User.findOne({
        email,
      });

    if (!user) {
      throw new Error(
        "Account not found. Please create an account."
      );
    }

    if (
      !user.isActive
    ) {
      throw new Error(
        "Your account is disabled."
      );
    }

    await checkResendCooldown(
      email,
      "login"
    );

    const otp =
      generateOtp();

    const otpHash =
      hashOtp(
        email,
        otp
      );

    const expiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRY_MINUTES *
            60 *
            1000
      );

    await Otp.findOneAndUpdate(
      {
        email,
        purpose:
          "login",
      },
      {
        otpHash,
        purpose:
          "login",
        attempts: 0,
        expiresAt,
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert:
          true,
      }
    );

    await sendOtpEmail(
      email,
      otp
    );

    return {
      message:
        "OTP sent successfully",
    };
  };


/* ========================================
   LOGIN — VERIFY OTP
======================================== */

export const verifyLoginOtp =
  async ({
    email: emailInput,
    otp,
  }: {
    email: string;
    otp: string;
  }) => {
    const email =
      normalizeEmail(
        emailInput
      );

    const user =
      await User.findOne({
        email,
      });

    if (!user) {
      throw new Error(
        "Account not found."
      );
    }

    if (
      !user.isActive
    ) {
      throw new Error(
        "Your account is disabled."
      );
    }

    const otpRecord =
      await Otp.findOne({
        email,
        purpose:
          "login",
      });

    if (!otpRecord) {
      throw new Error(
        "OTP expired or invalid."
      );
    }

    if (
      otpRecord
        .expiresAt
        .getTime() <
      Date.now()
    ) {
      await Otp.deleteOne({
        _id:
          otpRecord._id,
      });

      throw new Error(
        "OTP has expired. Please request a new OTP."
      );
    }

    if (
      otpRecord.attempts >=
      MAX_OTP_ATTEMPTS
    ) {
      await Otp.deleteOne({
        _id:
          otpRecord._id,
      });

      throw new Error(
        "Too many incorrect attempts. Please request a new OTP."
      );
    }

    const receivedHash =
      hashOtp(
        email,
        otp
      );

    if (
      receivedHash !==
      otpRecord.otpHash
    ) {
      otpRecord.attempts +=
        1;

      await otpRecord.save();

      throw new Error(
        "Incorrect OTP."
      );
    }

    await Otp.deleteOne({
      _id:
        otpRecord._id,
    });

    const token =
      generateToken(
        String(
          user._id
        ),
        user.role
      );

    return {
      user,
      token,
    };
  };