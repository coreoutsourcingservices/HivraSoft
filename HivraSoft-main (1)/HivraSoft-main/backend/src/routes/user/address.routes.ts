import express from "express";

import {
  createAddress,
  getAllAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../controllers/user/address.controller";

import {
  protect,
} from "../../middleware/auth.middleware";

const router =
  express.Router();

router.post(
  "/",
  protect,
  createAddress
);

router.get(
  "/",
  protect,
  getAllAddresses
);

router.get(
  "/:addressId",
  protect,
  getAddressById
);

router.put(
  "/:addressId",
  protect,
  updateAddress
);

router.patch(
  "/:addressId/default",
  protect,
  setDefaultAddress
);

router.delete(
  "/:addressId",
  protect,
  deleteAddress
);

export default router;