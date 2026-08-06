import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createPaymentIntent,processLocalWalletPayment,confirmStripePayment,verifyFirebaseOtp } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-payment-intent", protect, createPaymentIntent);
router.post("/local-wallet", protect, processLocalWalletPayment);
router.post("/confirm-stripe", protect, confirmStripePayment);
router.post("/verify-firebase-otp",protect,verifyFirebaseOtp);

export default router;