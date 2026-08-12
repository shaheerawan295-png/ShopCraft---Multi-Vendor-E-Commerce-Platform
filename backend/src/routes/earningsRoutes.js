import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getVendorEarnings,
  requestPayout,
  getAdminDashboardStats,
  updatePayoutStatus,
} from "../controllers/earningsController.js";

const router = express.Router();

router.get("/vendor/stats", protect, authorize("vendor"), getVendorEarnings);
router.post(
  "/vendor/request-payout",
  protect,
  authorize("vendor"),
  requestPayout,
);

router.get("/admin/stats", protect, authorize("admin"), getAdminDashboardStats);
router.put(
  "/admin/payout/:payoutId",
  protect,
  authorize("admin"),
  updatePayoutStatus,
);

export default router;
