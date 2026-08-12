import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import sendEmail from "../utils/sendEmail.js";

const VALID_ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Cancellation Requested",
];

const VALID_PAYMENT_METHODS = [
  "COD",
  "Stripe",
  "Stripe Card",
  "JazzCash",
  "Card",
  "EasyPaisa",
  "Wallet",
  "JazzCash / EasyPaisa (OTP)",
  "Local Wallet",
];

const badRequest = (message) => {
  const err = new Error(message);
  err.isClientError = true;
  return err;
};

const getVendorId = (product) => {
  if (!product) return null;
  if (product.vendor && typeof product.vendor === "object" && product.vendor._id) {
    return product.vendor._id.toString();
  }
  if (product.vendor) {
    return product.vendor.toString();
  }
  return null;
};

export const createOrder = async (req, res) => {
  
  const decrementedProducts = [];

  try {
    const {
      items,
      shippingAddress,
      paymentMethod = "COD",
      couponCode,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart items are required" });
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    
    let appliedCoupon = null;
    if (couponCode) {
      appliedCoupon = await Coupon.findOne({
        code: String(couponCode).trim().toUpperCase(),
        isActive: true,
      });
      if (!appliedCoupon) {
        return res.status(400).json({ success: false, message: "Invalid coupon code" });
      }
      if (new Date(appliedCoupon.expirationDate) < new Date()) {
        return res.status(400).json({ success: false, message: "This coupon has expired" });
      }
    }

    const vendorMap = {};
    const formattedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = item.product;
      if (!product || !product._id) {
        throw badRequest("Invalid product in cart");
      }

      const dbProduct = await Product.findById(product._id);
      if (!dbProduct) {
        throw badRequest(`Product not found: ${product.title || product._id}`);
      }

      const itemPrice = Number(dbProduct.price);
      const itemQty = Number(item.quantity);
      if (
        !Number.isFinite(itemPrice) ||
        !Number.isInteger(itemQty) ||
        itemQty <= 0
      ) {
        throw badRequest(`Invalid price/quantity for ${dbProduct.title}`);
      }

      
      const decremented = await Product.findOneAndUpdate(
        { _id: dbProduct._id, stock: { $gte: itemQty } },
        { $inc: { stock: -itemQty } },
        { new: true }
      );
      if (!decremented) {
        throw badRequest(
          `Insufficient stock for "${dbProduct.title}". Only ${dbProduct.stock} left.`
        );
      }
      decrementedProducts.push({ id: dbProduct._id, qty: itemQty });

      const itemTotal = itemPrice * itemQty;
      subtotal += itemTotal;

      const vendorId = getVendorId(dbProduct);
      if (!vendorId) {
        throw badRequest(`Product "${dbProduct.title}" has no vendor`);
      }

      const orderItem = {
        product: dbProduct._id,
        title: dbProduct.title,
        price: itemPrice,
        quantity: itemQty,
        vendor: vendorId,
      };

      if (!vendorMap[vendorId]) {
        vendorMap[vendorId] = {
          vendor: vendorId,
          items: [],
          subtotal: 0,
          status: "Pending",
        };
      }

      vendorMap[vendorId].items.push(orderItem);
      vendorMap[vendorId].subtotal += itemTotal;
      formattedItems.push(orderItem);
    }

    
    if (appliedCoupon && appliedCoupon.vendor) {
      const orderVendors = new Set(
        formattedItems.map((i) => i.vendor.toString())
      );
      if (!orderVendors.has(appliedCoupon.vendor.toString())) {
        return res.status(400).json({
          success: false,
          message: "This coupon is not valid for the items in your cart",
        });
      }
    }

    const discountAmount = appliedCoupon
      ? Math.round((subtotal * Number(appliedCoupon.discountPercentage)) / 100)
      : 0;
    const totalAmount = Math.max(0, subtotal - discountAmount);

    const vendorOrders = Object.values(vendorMap);

    const newOrder = await Order.create({
      customer: req.user._id,
      items: formattedItems,
      vendorOrders,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: "Pending",
      overallStatus: "Pending",
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      discountAmount,
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: newOrder,
    });
  } catch (error) {
    
    await Promise.all(
      decrementedProducts.map(({ id, qty }) =>
        Product.findByIdAndUpdate(id, { $inc: { stock: qty } }).catch(() => {})
      )
    );
    res.status(error.isClientError ? 400 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

const deriveOverallOrderStatus = (vendorOrders = []) => {
  if (!vendorOrders.length) return "Pending";
  if (vendorOrders.every((vo) => vo.status === "Delivered")) return "Completed";
  if (vendorOrders.every((vo) => vo.status === "Cancelled")) return "Cancelled";
  if (vendorOrders.some((vo) => vo.status === "Cancellation Requested")) return "Cancellation Requested";
  if (vendorOrders.some((vo) => vo.status === "Shipped")) return "Processing";
  if (vendorOrders.some((vo) => vo.status === "Processing")) return "Processing";
  return "Pending";
};

const sendVendorCancellationRequestEmail = async ({ vendor, customer, order, reason }) => {
  if (!vendor?.email) return;
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;line-height:1.6;">
      <h2 style="color:#1f2937;">Cancellation Requested</h2>
      <p>A customer has requested cancellation for order <strong>${order.orderNumber || order._id}</strong>.</p>
      <p><strong>Customer:</strong> ${customer?.name || "N/A"}</p>
      <p><strong>Reason:</strong><br/>${reason}</p>
      <p>Please review the request in your vendor dashboard.</p>
    </div>
  `;
  await sendEmail({
    email: vendor.email,
    subject: `Customer cancellation requested for order ${order.orderNumber || order._id}`,
    html,
    message: `Customer requested cancellation for order ${order.orderNumber || order._id}. Reason: ${reason}`,
  });
};

const sendCustomerCancellationApprovedEmail = async ({ customer, vendor, order, vendorReason, customerReason }) => {
  if (!customer?.email) return;
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;color:#111;line-height:1.6;">
      <h2 style="color:#1f2937;">Order Cancelled</h2>
      <p>Your order <strong>${order.orderNumber || order._id}</strong> has been cancelled by the vendor.</p>
      <p><strong>Vendor:</strong> ${vendor?.name || "Vendor"}</p>
      <p><strong>Customer request:</strong> ${customerReason || "N/A"}</p>
      <p><strong>Vendor message:</strong><br/>${vendorReason}</p>
      <p>If you have questions, please contact the merchant directly.</p>
    </div>
  `;
  await sendEmail({
    email: customer.email,
    subject: `Your order ${order.orderNumber || order._id} has been cancelled`,
    html,
    message: `Your order ${order.orderNumber || order._id} has been cancelled. Vendor message: ${vendorReason}`,
  });
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id, isDeletedByUser: false })
      .sort({ createdAt: -1 })
      .populate("vendorOrders.vendor", "name email")
      .populate("items.product", "title images price");

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const requestOrderCancellation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancellationReason } = req.body;

    if (!cancellationReason || !cancellationReason.trim()) {
      return res.status(400).json({ success: false, message: "Cancellation reason is required." });
    }

    const order = await Order.findById(orderId)
      .populate("vendorOrders.vendor", "name email")
      .populate("customer", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this order." });
    }

    const overallStatus = deriveOverallOrderStatus(order.vendorOrders);
    if (!["Pending", "Processing"].includes(overallStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cancellation can only be requested for pending or processing orders.",
      });
    }

    order.cancellationReason = cancellationReason;
    order.cancellationStatus = "Requested";
    order.previousOverallStatus = order.overallStatus;
    order.overallStatus = "Cancellation Requested";

    await Promise.all(order.vendorOrders.map(async (subOrder) => {
      if (subOrder.status !== "Cancelled") {
        subOrder.previousStatus = subOrder.status;
        subOrder.status = "Cancellation Requested";
        subOrder.cancellationStatus = "Requested";
        subOrder.cancellationReason = cancellationReason;
      }
      return subOrder;
    }));

    await order.save();

    await Promise.all(
      order.vendorOrders
        .filter((subOrder) => subOrder.vendor && subOrder.vendor.email)
        .map((subOrder) =>
          sendVendorCancellationRequestEmail({
            vendor: subOrder.vendor,
            customer: order.customer,
            order,
            reason: cancellationReason,
          })
        )
    );

    res.status(200).json({
      success: true,
      message: "Cancellation request submitted.",
      order,
    });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const approveVendorCancellation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { vendorReason } = req.body;
    const vendorId = req.user._id;

    if (!vendorReason || !vendorReason.trim()) {
      return res.status(400).json({ success: false, message: "Vendor cancellation reason is required." });
    }

    const order = await Order.findById(orderId)
      .populate("customer", "name email")
      .populate("vendorOrders.vendor", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const subOrder = order.vendorOrders.find(
      (vo) => vo.vendor.toString() === vendorId.toString()
    );

    if (!subOrder) {
      return res.status(403).json({ success: false, message: "Not authorized for this order." });
    }

    if (subOrder.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Order is already cancelled." });
    }

    subOrder.previousStatus = subOrder.status;
    subOrder.status = "Cancelled";
    subOrder.cancellationStatus = "Approved";
    subOrder.cancelReason = vendorReason;

    for (const item of subOrder.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    order.cancellationStatus = order.vendorOrders.every((vo) => vo.cancellationStatus === "Approved")
      ? "Approved"
      : "Requested";
    order.previousOverallStatus = order.overallStatus;
    order.overallStatus = deriveOverallOrderStatus(order.vendorOrders);

    await order.save();

    await sendCustomerCancellationApprovedEmail({
      customer: order.customer,
      vendor: subOrder.vendor,
      order,
      vendorReason,
      customerReason: subOrder.cancellationReason,
    });

    res.status(200).json({
      success: true,
      message: "Order cancelled and customer notified.",
      order,
      subOrder,
    });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this order." });
    }

    order.isDeletedByUser = true;
    await order.save();

    res.status(200).json({ success: true, message: "Order removed from your view." });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const orders = await Order.find({ "vendorOrders.vendor": vendorId })
      .populate("customer", "name email phone")
      .populate("vendorOrders.items.product", "title images price")
      .sort({ createdAt: -1 });

    const vendorSpecificOrders = orders.map((order) => {
      const vendorSubOrder = order.vendorOrders.find(
        (vo) => vo.vendor.toString() === vendorId.toString()
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber || `#${order._id.toString().slice(-6).toUpperCase()}`,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        status: vendorSubOrder?.status || "Pending",
        items: vendorSubOrder?.items || [],
        totalAmount: vendorSubOrder?.subtotal || 0,
        vendorEarnings: vendorSubOrder?.subtotal || 0,
        courierName: vendorSubOrder?.courierName || "",
        trackingId: vendorSubOrder?.trackingId || "",
        cancelReason: vendorSubOrder?.cancelReason || "",
        subOrder: vendorSubOrder,
      };
    });

    res.status(200).json({ success: true, orders: vendorSpecificOrders });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const updateVendorOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, courierName, trackingId, cancelReason, cancellationStatus } = req.body;
    const vendorId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const subOrder = order.vendorOrders.find(
      (vo) => vo.vendor.toString() === vendorId.toString()
    );

    if (!subOrder) {
      return res.status(403).json({ success: false, message: "Not authorized for this order" });
    }

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const previousStatus = subOrder.status;

    if (previousStatus === "Delivered" && status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered orders can no longer be changed",
      });
    }

    subOrder.status = status;

    if (courierName !== undefined) subOrder.courierName = courierName;
    if (trackingId !== undefined) subOrder.trackingId = trackingId;
    if (cancelReason !== undefined) subOrder.cancelReason = cancelReason;
    if (cancellationStatus !== undefined) {
      subOrder.cancellationStatus = cancellationStatus;
      order.cancellationStatus = cancellationStatus;
    }

    if (status === "Cancelled" && previousStatus !== "Cancelled") {
      
      for (const item of subOrder.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
    } else if (previousStatus === "Cancelled" && status !== "Cancelled") {
      
      
      for (const item of subOrder.items) {
        if (item.product) {
          const current = await Product.findById(item.product).select("stock");
          if (!current || current.stock < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock to re-activate: ${item.title || "item"}`,
            });
          }
        }
      }

      for (const item of subOrder.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
          });
        }
      }
    }

    const allDelivered = order.vendorOrders.every((vo) => vo.status === "Delivered");
    const allCancelled = order.vendorOrders.every((vo) => vo.status === "Cancelled");

    if (allDelivered) {
      order.overallStatus = "Completed";
      if (
        order.paymentMethod &&
        order.paymentMethod.toUpperCase() === "COD"
      ) {
        order.paymentStatus = "Paid";
        order.paidAt = new Date();
      }
    } else if (allCancelled) {
      order.overallStatus = "Cancelled";
    } else {
      order.overallStatus = "Processing";
    }

    await order.save();

    const updatedFormattedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber || `#${order._id.toString().slice(-6).toUpperCase()}`,
      customer: order.customer,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      status: subOrder.status,
      items: subOrder.items,
      totalAmount: subOrder.subtotal,
      vendorEarnings: subOrder.subtotal,
      courierName: subOrder.courierName || "",
      trackingId: subOrder.trackingId || "",
      cancelReason: subOrder.cancelReason || "",
      subOrder,
    };

res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedFormattedOrder,
      subOrder,
    });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};

export const deleteVendorOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const vendorId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const subOrderIndex = order.vendorOrders.findIndex(
      (vo) => vo.vendor.toString() === vendorId.toString()
    );

    if (subOrderIndex === -1) {
      return res.status(403).json({ success: false, message: "Not authorized for this order" });
    }

    const [subOrder] = order.vendorOrders.splice(subOrderIndex, 1);

if (subOrder.status !== "Cancelled") {
      for (const item of subOrder.items || []) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

order.items = (order.items || []).filter(
      (it) => it.vendor.toString() !== vendorId.toString()
    );

order.totalAmount = Math.max(
      0,
      order.vendorOrders.reduce((sum, vo) => sum + (vo.subtotal || 0), 0) -
        (order.discountAmount || 0)
    );

if (order.vendorOrders.length === 0) {
      await order.deleteOne();
      return res.status(200).json({
        success: true,
        message: "Order deleted successfully",
        deleted: true,
      });
    }

const allDelivered = order.vendorOrders.every((vo) => vo.status === "Delivered");
    const allCancelled = order.vendorOrders.every((vo) => vo.status === "Cancelled");

    if (allDelivered) {
      order.overallStatus = "Completed";
    } else if (allCancelled) {
      order.overallStatus = "Cancelled";
    } else {
      order.overallStatus = "Processing";
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order removed successfully",
      deleted: false,
    });
  } catch (error) {
    res
      .status(error.name === "CastError" ? 400 : 500)
      .json({ success: false, message: error.message });
  }
};
