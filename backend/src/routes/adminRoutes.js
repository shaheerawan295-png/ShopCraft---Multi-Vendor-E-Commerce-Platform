import { Router } from "express";
import {
  getAdminDashboardStats,
  toggleVendorApproval,
  getAdminOrders,
} from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, authorizeRoles("admin"));

 router.get("/dashboard", getAdminDashboardStats);

router.patch("/vendors/:id/approval", toggleVendorApproval);

router.get("/orders", getAdminOrders);

export default router;