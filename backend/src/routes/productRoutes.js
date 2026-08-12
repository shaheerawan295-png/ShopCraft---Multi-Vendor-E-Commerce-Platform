import express from "express";
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getVendorProducts 
} from "../controllers/productController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.use(protect);
router.use(authorize("vendor", "admin"));

router.route("/")
  .post(upload.array("images", 5), createProduct)
  .get(getVendorProducts);

router.route("/:id")
  .put(upload.array("images", 5), updateProduct)
  .delete(deleteProduct);

export default router;