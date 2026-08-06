import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = "COD" } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart items are required" });
    }

    const vendorMap = {};
    let totalAmount = 0;

    const formattedItems = items.map((item) => {
      const itemPrice = Number(item.product.price);
      const itemQty = Number(item.quantity);
      const itemTotal = itemPrice * itemQty;
      totalAmount += itemTotal;

      const vendorId = item.vendorId || item.product.vendor;

      const orderItem = {
        product: item.product._id,
        title: item.product.title,
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

      return orderItem;
    });

    const vendorOrders = Object.values(vendorMap);

    const newOrder = await Order.create({
      customer: req.user._id,
      items: formattedItems,
      vendorOrders,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Pending",
      overallStatus: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .populate("vendorOrders.vendor", "name email");

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const orders = await Order.find({ "vendorOrders.vendor": vendorId })
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    const vendorSpecificOrders = orders.map((order) => {
      const vendorSubOrder = order.vendorOrders.find(
        (vo) => vo.vendor.toString() === vendorId.toString()
      );

      return {
        orderId: order._id,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        subOrder: vendorSubOrder,
      };
    });

    res.status(200).json({ success: true, orders: vendorSpecificOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVendorOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
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

    subOrder.status = status;

    const allDelivered = order.vendorOrders.every((vo) => vo.status === "Delivered");
    if (allDelivered) {
      order.overallStatus = "Completed";
    } else {
      order.overallStatus = "Processing";
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      subOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};