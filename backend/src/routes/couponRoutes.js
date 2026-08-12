import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { createCoupon, applyCoupon, getCoupons, deleteCoupon } from "../controllers/couponController.js";

const router = express.Router();
router.post("/create", protect, authorize("vendor", "admin"), createCoupon);
router.get("/", protect, authorize("vendor", "admin"), getCoupons);
router.delete("/:id", protect, authorize("vendor", "admin"), deleteCoupon);
router.post("/apply", protect, applyCoupon);
export default router;
