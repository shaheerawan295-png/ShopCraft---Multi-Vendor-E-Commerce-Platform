import mongoose from "mongoose";
const payoutSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "JazzCash", "EasyPaisa"],
      required: true,
    },
    accountDetails: {
      accountTitle: { type: String, required: true },
      accountNumber: { type: String, required: true },
      bankName: { type: String },
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Payout = mongoose.model("Payout",payoutSchema);
export default Payout;

