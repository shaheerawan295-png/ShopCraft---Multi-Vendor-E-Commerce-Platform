import express from "express";
import { getPublicProducts, getSingleProduct } from "../controllers/publicProductController.js";

const router = express.Router();
router.get("/",getPublicProducts);
router.get("/:id",getSingleProduct);

export default router;
