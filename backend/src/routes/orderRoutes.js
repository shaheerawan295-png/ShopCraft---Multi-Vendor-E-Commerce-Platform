import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js"; // Existing Auth Guards
import {
  createOrder,
  getMyOrders,
  getVendorOrders,
  updateVendorOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// Customer Protected Routes
router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);

// Vendor Protected Routes
router.get("/vendor-orders", protect, authorize("vendor"), getVendorOrders);
router.patch("/vendor-orders/:orderId/status", protect, authorize("vendor"), updateVendorOrderStatus);

export default router;