import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  addReview,
  getProductReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

router.post("/", protect, addReview);

router.get("/product/:productId", getProductReviews);

export default router;
