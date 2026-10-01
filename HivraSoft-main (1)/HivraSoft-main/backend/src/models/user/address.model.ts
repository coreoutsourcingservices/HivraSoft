import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

/* =========================================================
   TYPES
========================================================= */

export type AddressType =
  | "home"
  | "work"
  | "other";

/* =========================================================
   ADDRESS INTERFACE
========================================================= */

export interface IAddress extends Document {
  user: Types.ObjectId;

  fullName: string;

  phone: string;
  alternatePhone?: string;

  /** Home / house / flat number entered by the customer. */
  homeNumber?: string;

  /** Office / unit / suite number entered by the customer. */
  officeNumber?: string;

  addressLine1: string;
  addressLine2?: string;
  landmark?: string;

  city: string;
  district?: string;
  state: string;
  postalCode: string;

  country: string;
  countryCode: string;

  addressType: AddressType;

  isDefault: boolean;

  isShippingAddress: boolean;
  isBillingAddress: boolean;

  instructions?: string;

  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   SCHEMA
========================================================= */

const addressSchema =
  new Schema<IAddress>(
    {
      /* ===============================================
         USER
      =============================================== */

      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      /* ===============================================
         CUSTOMER
      =============================================== */

      fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
      },

      alternatePhone: {
        type: String,
        trim: true,
        default: "",
        maxlength: 20,
      },

      /* ===============================================
         HOME / OFFICE NUMBER
      =============================================== */

      homeNumber: {
        type: String,
        trim: true,
        default: "",
        maxlength: 80,
      },

      officeNumber: {
        type: String,
        trim: true,
        default: "",
        maxlength: 80,
      },

      /* ===============================================
         ADDRESS
      =============================================== */

      addressLine1: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      addressLine2: {
        type: String,
        trim: true,
        default: "",
        maxlength: 200,
      },

      landmark: {
        type: String,
        trim: true,
        default: "",
        maxlength: 150,
      },

      city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      district: {
        type: String,
        trim: true,
        default: "",
        maxlength: 100,
      },

      state: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      postalCode: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
      },

      country: {
        type: String,
        required: true,
        trim: true,
        default: "India",
        maxlength: 100,
      },

      countryCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        default: "IN",
        maxlength: 2,
      },

      /* ===============================================
         ADDRESS TYPE
      =============================================== */

      addressType: {
        type: String,
        enum: [
          "home",
          "work",
          "other",
        ],
        default: "home",
      },

      /* ===============================================
         DEFAULT ADDRESS
      =============================================== */

      isDefault: {
        type: Boolean,
        default: false,
      },

      /* ===============================================
         SHIPPING / BILLING
      =============================================== */

      isShippingAddress: {
        type: Boolean,
        default: true,
      },

      isBillingAddress: {
        type: Boolean,
        default: true,
      },

      /* ===============================================
         DELIVERY INSTRUCTIONS
      =============================================== */

      instructions: {
        type: String,
        trim: true,
        default: "",
        maxlength: 300,
      },
    },

    {
      timestamps: true,
      versionKey: false,
    }
  );

/* =========================================================
   INDEXES
========================================================= */

/*
  User ke addresses ko newest first
  fetch karne ke liye.
*/

addressSchema.index({
  user: 1,
  createdAt: -1,
});

/*
  User ke default address ko quickly
  find karne ke liye.
*/

addressSchema.index({
  user: 1,
  isDefault: 1,
});

/* =========================================================
   JSON OUTPUT TRANSFORM
========================================================= */

addressSchema.set(
  "toJSON",
  {
    transform: (
      _doc,
      ret: any
    ) => {
      /*
        MongoDB:

        _id: ObjectId(...)
        user: ObjectId(...)

        API:

        id: "..."
        userId: "..."
      */

      ret.id =
        ret._id?.toString();

      ret.userId =
        ret.user?.toString();

      delete ret._id;
      delete ret.user;

      return ret;
    },
  }
);

/* =========================================================
   MODEL
========================================================= */

const Address: Model<IAddress> =
  mongoose.models.Address ||
  mongoose.model<IAddress>(
    "Address",
    addressSchema
  );

export default Address;