import Coupon from "../models/Coupon.js";

export const createCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, expirationDate, vendor } = req.body;

    if (
      !code ||
      discountPercentage === undefined ||
      discountPercentage === null ||
      discountPercentage === "" ||
      !expirationDate
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const discountValue = Number(discountPercentage);
    if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount percentage must be between 1 and 100",
      });
    }

    if (new Date(expirationDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expiration date must be in the future",
      });
    }

    const formattedCode = code.trim().toUpperCase();

    const existingCoupon = await Coupon.findOne({ code: formattedCode });
    if (existingCoupon) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon code already exists" });
    }

    const couponVendor =
      req.user.role === "vendor" ? req.user._id : vendor || null;

    const coupon = await Coupon.create({
      code: formattedCode,
      discountPercentage: discountValue,
      expirationDate,
      vendor: couponVendor,
    });

    res
      .status(201)
      .json({ success: true, message: "Coupon created successfully!", coupon });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { vendor: req.user._id };

    const coupons = await Coupon.find(query)
      .populate("vendor", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    const isOwnerVendor =
      coupon.vendor?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAdmin && !isOwnerVendor) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to delete this coupon" });
    }

    await Coupon.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { code, vendorIds } = req.body;

    if (!code) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid coupon code" });
    }

    if (new Date(coupon.expirationDate) < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "This coupon has expired" });
    }

    
    if (coupon.vendor && Array.isArray(vendorIds) && vendorIds.length > 0) {
      const hasMatchingVendor = vendorIds.some(
        (vid) => vid && coupon.vendor.toString() === vid.toString()
      );
      if (!hasMatchingVendor) {
        return res.status(400).json({
          success: false,
          message: "This coupon is not valid for the items in your cart",
        });
      }
    }

    res.status(200).json({
      success: true,
      couponId: coupon._id,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      vendor: coupon.vendor,
      message: `${coupon.discountPercentage}% discount applied!`,
    });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

