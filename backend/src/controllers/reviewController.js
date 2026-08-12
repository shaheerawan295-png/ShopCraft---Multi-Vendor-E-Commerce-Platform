import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    if (
      !productId ||
      rating === undefined ||
      rating === null ||
      rating === "" ||
      !comment
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const ratingValue = Number(rating);
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number between 1 and 5",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    
    if (
      product.vendor &&
      product.vendor.toString() === userId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot review your own product",
      });
    }

    
    
    
    const verifiedPurchase = await Order.exists({
      customer: userId,
      "vendorOrders.items.product": productId,
      "vendorOrders.status": { $ne: "Cancelled" },
    });

    const review = await Review.findOneAndUpdate(
      { product: productId, user: userId },
      {
        product: productId,
        user: userId,
        vendor: product.vendor,
        rating: ratingValue,
        comment,
        isVerifiedPurchase: Boolean(verifiedPurchase),
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: "Review submitted successfully!",
      review,
    });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

