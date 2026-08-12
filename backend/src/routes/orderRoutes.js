import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  createOrder,
  getMyOrders,
  getVendorOrders,
  updateVendorOrderStatus,
  deleteVendorOrder,
  requestOrderCancellation,
  approveVendorCancellation,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.post("/:orderId/request-cancel", protect, requestOrderCancellation);
router.delete("/:orderId", protect, deleteOrder);

router.get("/vendor-orders", protect, authorize("vendor"), getVendorOrders);
router.patch("/vendor-orders/:orderId/status", protect, authorize("vendor"), updateVendorOrderStatus);
router.post("/vendor-orders/:orderId/approve-cancellation", protect, authorize("vendor"), approveVendorCancellation);
router.delete("/vendor-orders/:orderId", protect, authorize("vendor"), deleteVendorOrder);

export default router;