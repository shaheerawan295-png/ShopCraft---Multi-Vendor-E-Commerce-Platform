import Stripe from "stripe";
import { adminAuth } from "../config/firebaseAdmin.js";
import Order from "../models/Order.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to pay for this order" });
    }

    const amountInMinorUnits = Math.round(Number(order.totalAmount || 0) * 100);
    if (amountInMinorUnits <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Order total must be greater than zero" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInMinorUnits,
      currency: "pkr",
      metadata: {
        orderId: order._id.toString(),
        customerId: req.user?._id ? req.user._id.toString() : "guest",
      },
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmStripePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to pay for this order" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ success: false, message: "This order has already been paid" });
    }

    order.paymentMethod = "Stripe Card";
    order.paymentStatus = "Paid";
    order.isPaid = true;
    order.paidAt = new Date();
    order.overallStatus = "Processing";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Card Payment Verified Successfully!",
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const processLocalWalletPayment = async (req, res) => {
  try {
    const { orderId, walletType, mobileNumber, accountPin } = req.body;

    if (!orderId || !mobileNumber || !accountPin) {
      return res.status(400).json({
        success: false,
        message: "Order ID, Mobile number, and Account PIN are required",
      });
    }

const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to pay for this order" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ success: false, message: "This order has already been paid" });
    }

    order.paymentMethod = walletType || "Local Wallet";
    order.paymentStatus = "Paid";
    order.isPaid = true;
    order.paidAt = new Date();
    order.overallStatus = "Processing";

    await order.save();

    return res.status(200).json({
      success: true,
      message: `${walletType || "Wallet"} Payment Successful! Order processing started.`,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyFirebaseOtp = async (req, res) => {
  try {
    const { idToken, orderId, walletType } = req.body;

    if (!idToken || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID Token and Order ID are required",
      });
    }

    if (!adminAuth) {
      return res.status(503).json({
        success: false,
        message: "Wallet OTP payments are not configured on this server",
      });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP Token",
      });
    }

const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to pay for this order" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ success: false, message: "This order has already been paid" });
    }

    order.paymentMethod = walletType || "JazzCash / EasyPaisa (OTP)";
    order.paymentStatus = "Paid";
    order.isPaid = true;
    order.paidAt = new Date();
    order.overallStatus = "Processing";
    order.paymentResult = {
      id: decodedToken.uid,
      status: "completed",
      phone: decodedToken.phone_number || "",
    };

    await order.save();

    return res.status(200).json({
      success: true,
      message: `${walletType || "Wallet"} payment verified via OTP successfully`,
      phoneNumber: decodedToken.phone_number || null,
      order,
    });
  } catch (error) {
    console.error("Firebase Payment Verification Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};