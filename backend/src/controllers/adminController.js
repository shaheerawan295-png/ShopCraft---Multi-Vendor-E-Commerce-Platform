import User from "../models/userModel.js";
import Order from "../models/Order.js";
export const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalVendors,
      pendingVendorsCount,
      totalCustomers,
      totalOrders,
      revenueAggregation,
      recentOrders,
      pendingVendors,
    ] = await Promise.all([
      User.countDocuments({ role: "vendor" }),
      User.countDocuments({ role: "vendor", isApproved: false }),
      User.countDocuments({ role: "customer" }),
      Order.countDocuments({}),
      Order.aggregate([
        { $match: { $or: [{ isPaid: true }, { paymentStatus: "Paid" }] } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]),
      Order.find({})
        .populate("customer", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      User.find({ role: "vendor", isApproved: false })
        .select("name email createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;
    const platformCommission = totalRevenue * 0.10;

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        platformCommission,
        totalVendors,
        pendingVendorsCount,
        totalOrders,
        totalCustomers,
      },
      recentOrders,
      pendingVendors,
    });
  } catch (error) {
    return res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const toggleVendorApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    
    const approvedValue =
      isApproved === true || isApproved === "true" || isApproved === 1;

    const vendor = await User.findOne({ _id: id, role: "vendor" });

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    vendor.isApproved = approvedValue;
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: `Vendor ${approvedValue ? "approved" : "rejected"} successfully`,
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        isApproved: vendor.isApproved,
      },
    });
  } catch (error) {
    return res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({})
        .populate("customer", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    return res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};