import Order from "../models/Order.js";
import Payout from "../models/Payout.js";
import User from "../models/userModel.js";

const COMMISSION_RATE = 0.1;

const computeVendorBalance = async (vendorId) => {
  const orders = await Order.find({
    "vendorOrders.vendor": vendorId,
    paymentStatus: "Paid",
  });

  let totalGrossSales = 0;
  orders.forEach((order) => {
    order.vendorOrders.forEach((vo) => {
      if (vo.vendor.toString() === vendorId.toString() && vo.status !== "Cancelled") {
        totalGrossSales += vo.subtotal || 0;
      }
    });
  });

  const adminCommissionDeducted = totalGrossSales * COMMISSION_RATE;
  const netEarnings = totalGrossSales - adminCommissionDeducted;

  const payouts = await Payout.find({ vendor: vendorId });
  const totalWithdrawn = payouts
    .filter((p) => p.status === "Approved")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayouts = payouts
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    totalGrossSales,
    adminCommissionDeducted,
    netEarnings,
    availableBalance: netEarnings - totalWithdrawn - pendingPayouts,
  };
};

export const getVendorEarnings = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const {
      totalGrossSales,
      adminCommissionDeducted,
      netEarnings,
      availableBalance,
      totalWithdrawn,
      pendingPayouts,
    } = await computeVendorBalance(vendorId);

    const payouts = await Payout.find({ vendor: vendorId });
    res.status(200).json({
      success: true,
      stats: {
        totalGrossSales,
        adminCommissionDeducted,
        netEarnings,
        availableBalance,
        totalWithdrawn,
        pendingPayouts,
      },
      payoutHistory: payouts,
    });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const requestPayout = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { amount, paymentMethod, accountTitle, accountNumber, bankName } = req.body;

    const requestedAmount = Number(amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payout amount" });
    }

    const VALID_METHODS = ["Bank Transfer", "JazzCash", "EasyPaisa"];
    if (!VALID_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    if (!accountTitle || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Account title and account number are required",
      });
    }

    const { availableBalance } = await computeVendorBalance(vendorId);
    if (requestedAmount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Requested amount exceeds your available balance (${availableBalance.toFixed(2)}).`,
      });
    }

    const newPayout = await Payout.create({
      vendor: vendorId,
      amount: requestedAmount,
      paymentMethod,
      accountDetails: { accountTitle, accountNumber, bankName },
    });

    res.status(201).json({
      success: true,
      message: "Payout request submitted successfully!",
      payout: newPayout,
    });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const getAdminDashboardStats = async (req, res) => {
  try {
    const allPaidOrders = await Order.find({ paymentStatus: "Paid" });
    const totalVendors = await User.countDocuments({ role: "vendor" });

    let marketplaceGMV = 0;

    allPaidOrders.forEach((order) => {
      marketplaceGMV += order.totalAmount || 0;
    });

    const totalAdminRevenue = marketplaceGMV * COMMISSION_RATE;
    const pendingPayouts = await Payout.find({ status: "Pending" }).populate("vendor", "name email");

    res.status(200).json({
      success: true,
      stats: {
        marketplaceGMV,
        totalAdminRevenue,
        totalVendors,
        totalOrders: allPaidOrders.length,
      },
      pendingPayouts,
    });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const updatePayoutStatus = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status } = req.body;

    const VALID_PAYOUT_STATUSES = ["Pending", "Approved", "Rejected"];
    if (!VALID_PAYOUT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid payout status" });
    }

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout request not found" });
    }

    payout.status = status;
    payout.processedAt = Date.now();
    await payout.save();

    res.status(200).json({
      success: true,
      message: `Payout request ${status.toLowerCase()} successfully!`,
      payout,
    });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};