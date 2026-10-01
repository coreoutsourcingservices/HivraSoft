import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt, {
  JwtPayload,
  TokenExpiredError,
  JsonWebTokenError,
} from "jsonwebtoken";

import mongoose from "mongoose";

import Address from "../../models/user/address.model";
import User from "../../models/User.model";

/* =========================================================
   TYPES
========================================================= */

type AddressType =
  | "home"
  | "work"
  | "other";

interface TokenPayload
  extends JwtPayload {
  id?: string;
  userId?: string;
  _id?: string;
}

export type AuthRequest = Request;

/* =========================================================
   CONSTANTS
========================================================= */

const ADDRESS_TYPES: AddressType[] = [
  "home",
  "work",
  "other",
];

/* =========================================================
   HELPERS
========================================================= */

/**
 * Logged-in user id
 */
function getUserId(
  req: AuthRequest
): string | null {
  const userId =
    req.user?._id?.toString();

  return userId || null;
}

/**
 * Valid address type
 */
function isValidAddressType(
  value: unknown
): value is AddressType {
  return (
    typeof value === "string" &&
    ADDRESS_TYPES.includes(
      value as AddressType
    )
  );
}

/**
 * Optional string cleaner
 */
function cleanString(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/* =========================================================
   PROTECT
========================================================= */

/**
 * Authentication middleware
 *
 * Supports:
 * 1. Cookie: token
 * 2. Authorization: Bearer TOKEN
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    /* =====================================================
       COOKIE TOKEN
    ===================================================== */

    if (
      typeof req.cookies?.token ===
        "string" &&
      req.cookies.token
    ) {
      token = req.cookies.token;
    }

    /* =====================================================
       BEARER TOKEN
    ===================================================== */

    if (!token) {
      const authorization =
        req.headers.authorization;

      if (
        authorization &&
        authorization.startsWith(
          "Bearer "
        )
      ) {
        token =
          authorization
            .slice(7)
            .trim();
      }
    }

    /* =====================================================
       TOKEN NOT FOUND
    ===================================================== */

    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Unauthorized. Please login.",
        });
    }

    /* =====================================================
       JWT SECRET
    ===================================================== */

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error(
        "JWT_SECRET is missing."
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Server configuration error.",
        });
    }

    /* =====================================================
       VERIFY TOKEN
    ===================================================== */

    const decoded = jwt.verify(
      token,
      jwtSecret
    );

    if (
      typeof decoded !== "object" ||
      decoded === null
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid authentication token.",
        });
    }

    const payload =
      decoded as TokenPayload;

    const userId =
      payload.id ||
      payload.userId ||
      payload._id;

    if (!userId) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid authentication token.",
        });
    }

    /* =====================================================
       VALID MONGODB ID
    ===================================================== */

    if (
      !mongoose.isValidObjectId(
        userId
      )
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid authentication token.",
        });
    }

    /* =====================================================
       CHECK USER EXISTS
    ===================================================== */

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "User account not found.",
        });
    }

    /* =====================================================
       ATTACH USER
    ===================================================== */

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "PROTECT ERROR:",
      error
    );

    if (
      error instanceof
      TokenExpiredError
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Session expired. Please login again.",
        });
    }

    if (
      error instanceof
      JsonWebTokenError
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid authentication token.",
        });
    }

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Authentication failed.",
      });
  }
};

/* =========================================================
   CREATE ADDRESS
   POST /api/addresses
========================================================= */

export const createAddress = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Unauthorized. Please login.",
        });
    }

    const {
      fullName,
      phone,
      alternatePhone,

      homeNumber,
      officeNumber,

      addressLine1,
      addressLine2,
      landmark,

      city,
      district,
      state,
      postalCode,

      country,
      countryCode,

      addressType,

      isDefault,
      isShippingAddress,
      isBillingAddress,

      instructions,
    } = req.body;

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (
      typeof fullName !==
        "string" ||
      !fullName.trim()
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Full name is required.",
        });
    }

    if (
      typeof phone !==
        "string" ||
      !phone.trim()
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Phone number is required.",
        });
    }

    if (
      typeof addressLine1 !==
        "string" ||
      !addressLine1.trim()
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Address line 1 is required.",
        });
    }

    if (
      typeof city !==
        "string" ||
      !city.trim()
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "City is required.",
        });
    }

    if (
      typeof state !==
        "string" ||
      !state.trim()
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "State is required.",
        });
    }

    if (
      typeof postalCode !==
        "string" ||
      !postalCode.trim()
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Postal code is required.",
        });
    }

    /* =====================================================
       ADDRESS TYPE
    ===================================================== */

    if (
      addressType !==
        undefined &&
      !isValidAddressType(
        addressType
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Address type must be home, work or other.",
        });
    }

    /* =====================================================
       BOOLEAN VALIDATION
    ===================================================== */

    if (
      isDefault !== undefined &&
      typeof isDefault !==
        "boolean"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "isDefault must be boolean.",
        });
    }

    if (
      isShippingAddress !==
        undefined &&
      typeof isShippingAddress !==
        "boolean"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "isShippingAddress must be boolean.",
        });
    }

    if (
      isBillingAddress !==
        undefined &&
      typeof isBillingAddress !==
        "boolean"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "isBillingAddress must be boolean.",
        });
    }

    /* =====================================================
       FIRST ADDRESS = DEFAULT
    ===================================================== */

    const addressCount =
      await Address.countDocuments({
        user: userId,
      });

    const shouldBeDefault =
      addressCount === 0 ||
      isDefault === true;

    /* =====================================================
       REMOVE OLD DEFAULT
    ===================================================== */

    if (shouldBeDefault) {
      await Address.updateMany(
        {
          user: userId,
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );
    }

    /* =====================================================
       CREATE
    ===================================================== */

    const address =
      await Address.create({
        user: userId,

        fullName:
          fullName.trim(),

        phone:
          phone.trim(),

        alternatePhone:
          cleanString(
            alternatePhone
          ),

        homeNumber:
          cleanString(
            homeNumber
          ),

        officeNumber:
          cleanString(
            officeNumber
          ),

        addressLine1:
          addressLine1.trim(),

        addressLine2:
          cleanString(
            addressLine2
          ),

        landmark:
          cleanString(
            landmark
          ),

        city:
          city.trim(),

        district:
          cleanString(
            district
          ),

        state:
          state.trim(),

        postalCode:
          postalCode.trim(),

        country:
          cleanString(country) ||
          "India",

        countryCode:
          (
            cleanString(
              countryCode
            ) || "IN"
          ).toUpperCase(),

        addressType:
          addressType || "home",

        isDefault:
          shouldBeDefault,

        isShippingAddress:
          typeof isShippingAddress ===
          "boolean"
            ? isShippingAddress
            : true,

        isBillingAddress:
          typeof isBillingAddress ===
          "boolean"
            ? isBillingAddress
            : true,

        instructions:
          cleanString(
            instructions
          ),
      });

    return res
      .status(201)
      .json({
        success: true,
        message:
          "Address added successfully.",
        address,
      });
  } catch (error) {
    console.error(
      "CREATE ADDRESS ERROR:",
      error
    );

    if (
      error instanceof
      mongoose.Error.ValidationError
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
          "Unable to add address.",
      });
  }
};

/* =========================================================
   GET ALL ADDRESSES
   GET /api/addresses
========================================================= */

export const getAllAddresses =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        getUserId(req);

      if (!userId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unauthorized. Please login.",
          });
      }

      const addresses =
        await Address.find({
          user: userId,
        }).sort({
          isDefault: -1,
          createdAt: -1,
        });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Addresses fetched successfully.",

          count:
            addresses.length,

          addresses,
        });
    } catch (error) {
      console.error(
        "GET ALL ADDRESSES ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to fetch addresses.",
        });
    }
  };

/* =========================================================
   GET ONE ADDRESS
   GET /api/addresses/:addressId
========================================================= */

export const getAddressById =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        getUserId(req);

      if (!userId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unauthorized. Please login.",
          });
      }

      const { addressId } =
        req.params;

      /* ===================================================
         VALID ADDRESS ID
      =================================================== */

      if (
        !mongoose.isValidObjectId(
          addressId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid address id.",
          });
      }

      /* ===================================================
         OWNERSHIP CHECK
      =================================================== */

      const address =
        await Address.findOne({
          _id: addressId,
          user: userId,
        });

      if (!address) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Address not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Address fetched successfully.",
          address,
        });
    } catch (error) {
      console.error(
        "GET ADDRESS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to fetch address.",
        });
    }
  };

/* =========================================================
   UPDATE ADDRESS
   PUT /api/addresses/:addressId
========================================================= */

export const updateAddress =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        getUserId(req);

      if (!userId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unauthorized. Please login.",
          });
      }

      const { addressId } =
        req.params;

      if (
        !mongoose.isValidObjectId(
          addressId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid address id.",
          });
      }

      /* ===================================================
         FIND USER ADDRESS
      =================================================== */

      const address =
        await Address.findOne({
          _id: addressId,
          user: userId,
        });

      if (!address) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Address not found.",
          });
      }

      const {
        fullName,
        phone,
        alternatePhone,

        homeNumber,
        officeNumber,

        addressLine1,
        addressLine2,
        landmark,

        city,
        district,
        state,
        postalCode,

        country,
        countryCode,

        addressType,

        isDefault,
        isShippingAddress,
        isBillingAddress,

        instructions,
      } = req.body;

      /* ===================================================
         REQUIRED STRING FIELDS
      =================================================== */

      if (
        fullName !== undefined
      ) {
        if (
          typeof fullName !==
            "string" ||
          !fullName.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Full name cannot be empty.",
            });
        }

        address.fullName =
          fullName.trim();
      }

      if (phone !== undefined) {
        if (
          typeof phone !==
            "string" ||
          !phone.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Phone cannot be empty.",
            });
        }

        address.phone =
          phone.trim();
      }

      if (
        addressLine1 !==
        undefined
      ) {
        if (
          typeof addressLine1 !==
            "string" ||
          !addressLine1.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Address line 1 cannot be empty.",
            });
        }

        address.addressLine1 =
          addressLine1.trim();
      }

      if (city !== undefined) {
        if (
          typeof city !==
            "string" ||
          !city.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "City cannot be empty.",
            });
        }

        address.city =
          city.trim();
      }

      if (state !== undefined) {
        if (
          typeof state !==
            "string" ||
          !state.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "State cannot be empty.",
            });
        }

        address.state =
          state.trim();
      }

      if (
        postalCode !== undefined
      ) {
        if (
          typeof postalCode !==
            "string" ||
          !postalCode.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Postal code cannot be empty.",
            });
        }

        address.postalCode =
          postalCode.trim();
      }

      /* ===================================================
         OPTIONAL STRINGS
      =================================================== */

      if (
        alternatePhone !==
        undefined
      ) {
        address.alternatePhone =
          cleanString(
            alternatePhone
          );
      }

      if (
        homeNumber !==
        undefined
      ) {
        address.homeNumber =
          cleanString(
            homeNumber
          );
      }

      if (
        officeNumber !==
        undefined
      ) {
        address.officeNumber =
          cleanString(
            officeNumber
          );
      }

      if (
        addressLine2 !==
        undefined
      ) {
        address.addressLine2 =
          cleanString(
            addressLine2
          );
      }

      if (
        landmark !== undefined
      ) {
        address.landmark =
          cleanString(
            landmark
          );
      }

      if (
        district !== undefined
      ) {
        address.district =
          cleanString(
            district
          );
      }

      if (
        country !== undefined
      ) {
        if (
          typeof country !==
            "string" ||
          !country.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Country cannot be empty.",
            });
        }

        address.country =
          country.trim();
      }

      if (
        countryCode !== undefined
      ) {
        if (
          typeof countryCode !==
            "string" ||
          !countryCode.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Country code cannot be empty.",
            });
        }

        address.countryCode =
          countryCode
            .trim()
            .toUpperCase();
      }

      if (
        instructions !==
        undefined
      ) {
        address.instructions =
          cleanString(
            instructions
          );
      }

      /* ===================================================
         ADDRESS TYPE
      =================================================== */

      if (
        addressType !== undefined
      ) {
        if (
          !isValidAddressType(
            addressType
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Address type must be home, work or other.",
            });
        }

        address.addressType =
          addressType;
      }

      /* ===================================================
         SHIPPING
      =================================================== */

      if (
        isShippingAddress !==
        undefined
      ) {
        if (
          typeof isShippingAddress !==
          "boolean"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "isShippingAddress must be boolean.",
            });
        }

        address.isShippingAddress =
          isShippingAddress;
      }

      /* ===================================================
         BILLING
      =================================================== */

      if (
        isBillingAddress !==
        undefined
      ) {
        if (
          typeof isBillingAddress !==
          "boolean"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "isBillingAddress must be boolean.",
            });
        }

        address.isBillingAddress =
          isBillingAddress;
      }

      /* ===================================================
         DEFAULT ADDRESS
      =================================================== */

      /* ===================================================
         SAVE
      =================================================== */

      await address.save();

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Address updated successfully.",
          address,
        });
    } catch (error) {
      console.error(
        "UPDATE ADDRESS ERROR:",
        error
      );

      if (
        error instanceof
        mongoose.Error.ValidationError
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
            "Unable to update address.",
        });
    }
  };

/* =========================================================
   DELETE ADDRESS
   DELETE /api/addresses/:addressId
========================================================= */

export const deleteAddress =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        getUserId(req);

      if (!userId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unauthorized. Please login.",
          });
      }

      const { addressId } =
        req.params;

      if (
        !mongoose.isValidObjectId(
          addressId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid address id.",
          });
      }

      /* ===================================================
         FIND
      =================================================== */

      const address =
        await Address.findOne({
          _id: addressId,
          user: userId,
        });

      if (!address) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Address not found.",
          });
      }

      const wasDefault =
        address.isDefault;

      /* ===================================================
         DELETE
      =================================================== */

      await address.deleteOne();

      /* ===================================================
         IF DEFAULT DELETED,
         MAKE ANOTHER DEFAULT
      =================================================== */

      if (wasDefault) {
        const nextAddress =
          await Address.findOne({
            user: userId,
          }).sort({
            createdAt: -1,
          });

        if (nextAddress) {
          nextAddress.isDefault =
            true;

          await nextAddress.save();
        }
      }

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Address deleted successfully.",
        });
    } catch (error) {
      console.error(
        "DELETE ADDRESS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to delete address.",
        });
    }
  };

/* =========================================================
   SET DEFAULT ADDRESS
   PATCH /api/addresses/:addressId/default
========================================================= */

export const setDefaultAddress =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        getUserId(req);

      if (!userId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unauthorized. Please login.",
          });
      }

      const { addressId } =
        req.params;

      if (
        !mongoose.isValidObjectId(
          addressId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid address id.",
          });
      }

      /* ===================================================
         ADDRESS MUST BELONG TO USER
      =================================================== */

      const address =
        await Address.findOne({
          _id: addressId,
          user: userId,
        });

      if (!address) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Address not found.",
          });
      }

      /* ===================================================
         ALREADY DEFAULT
      =================================================== */

      if (address.isDefault) {
        return res
          .status(200)
          .json({
            success: true,
            message:
              "This address is already the default address.",
            address,
          });
      }

      /* ===================================================
         REMOVE DEFAULT FROM OTHER ADDRESSES
      =================================================== */

      await Address.updateMany(
        {
          user: userId,

          _id: {
            $ne: addressId,
          },
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );

      /* ===================================================
         SET NEW DEFAULT
      =================================================== */

      address.isDefault = true;

      await address.save();

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Default address updated successfully.",
          address,
        });
    } catch (error) {
      console.error(
        "SET DEFAULT ADDRESS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to set default address.",
        });
    }
  };
