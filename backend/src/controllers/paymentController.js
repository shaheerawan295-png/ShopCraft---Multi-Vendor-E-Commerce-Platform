import Stripe from "stripe";
import { adminAuth } from "../config/firebaseAdmin.js";
import Order from "../models/Order.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ----------------------------------------------------
// 1. Stripe Payment Intent (Create Client Secret)
// ----------------------------------------------------
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

    const amountInCents = Math.round(order.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
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

// ----------------------------------------------------
// 2. Stripe Card Payment Confirmation
// ----------------------------------------------------
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

    order.paymentMethod = "Stripe Card";
    order.paymentStatus = "Paid";
    order.isPaid = true;
    order.paidAt = Date.now();
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

// ----------------------------------------------------
// 3. Local Wallet Manual Payment (Direct PIN)
// ----------------------------------------------------
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

    order.paymentMethod = walletType || "Local Wallet";
    order.paymentStatus = "Paid";
    order.isPaid = true;
    order.paidAt = Date.now();
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

// ----------------------------------------------------
// 4. Firebase OTP Verified Wallet Payment (JazzCash/EasyPaisa via SMS)
// ----------------------------------------------------
export const verifyFirebaseOtp = async (req, res) => {
  try {
    const { idToken, orderId, walletType } = req.body;

    if (!idToken || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID Token and Order ID are required",
      });
    }

    // Firebase Admin Auth Token Verification
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

    order.paymentMethod = walletType || "JazzCash / EasyPaisa (OTP)";
    order.paymentStatus = "Paid";
    order.isPaid = true;
    order.paidAt = Date.now();
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