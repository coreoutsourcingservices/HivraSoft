import { Router } from "express";
import { listActiveOffers } from "../controllers/offer.controller";

const router = Router();

router.get("/", listActiveOffers);

export default router;
