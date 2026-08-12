import express from "express";
import { getCategories, createCategory, deleteCategory } from "../controllers/categoryController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/", getCategories);
router.post("/", protect, authorize("admin"), createCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

export default router;
