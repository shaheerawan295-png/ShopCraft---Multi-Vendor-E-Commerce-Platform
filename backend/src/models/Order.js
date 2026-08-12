import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const vendorOrderSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Cancellation Requested"],
    default: "Pending",
  },
  previousStatus: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
  },
  courierName: { type: String },
  trackingId: { type: String },
  cancelReason: { type: String },
  cancellationReason: { type: String },
  cancellationStatus: {
    type: String,
    enum: ["None", "Requested", "Approved", "Rejected"],
    default: "None",
  },
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    vendorOrders: [vendorOrderSchema],
    currency: { type: String, enum: ["PKR"], default: "PKR" },
    totalAmount: { type: Number, required: true },
    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: [
        "COD",
        "Stripe",
        "Stripe Card",
        "JazzCash",
        "Card",
        "EasyPaisa",
        "Wallet",
        "JazzCash / EasyPaisa (OTP)",
        "Local Wallet",
      ],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
overallStatus: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Cancelled", "Cancellation Requested"],
      default: "Pending",
    },
    previousOverallStatus: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Cancelled", "Cancellation Requested"],
    },
    cancellationReason: { type: String },
    cancellationStatus: {
      type: String,
      enum: ["None", "Requested", "Approved", "Rejected"],
      default: "None",
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    couponCode: { type: String, trim: true, uppercase: true },
    discountAmount: { type: Number, default: 0, min: 0 },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      phone: { type: String },
    },
    isDeletedByUser: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
