import { Router } from "express";
import { submitSendYourBra, submitResellerRegistration } from "../controllers/lead-form.controller";

const router = Router();
router.post("/send-your-bra", submitSendYourBra);
router.post("/reseller-registration", submitResellerRegistration);
export default router;
