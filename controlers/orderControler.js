import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import BillingInvoice from "../models/billingInvoiceModel.js";
import sendEmail from "../utils/sendEmail.js";

// @desc Create new order
// @route POST /api/orders
// @access Private
const addorderitems = asyncHandler(async (req, res) => {
  console.log(req.user);

  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    shippingRates,
  } = req.body;
  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
    return;
  } else {
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      shippingRates,
    });
    const createdOrder = await order.save();
    try {
      const user = req.user; // Assuming you've attached user in middleware
      await sendEmail({
        email: user.email,
        status: "Created",
        orderId: createdOrder._id,
      });
      console.log("✅ Order status email sent");
    } catch (error) {
      console.error("❌ Error sending order email:", error.message);
    }
    // Update user orderHistory
    await User.findByIdAndUpdate(req.user._id, {
      $push: { orderHistory: createdOrder._id },
    });
    // REMOVE CARTITEMS AFTER PURCHASED PRODUCT STARTS
    try {
      await User.findByIdAndUpdate(req.user._id, {
        $set: { cartItems: [] },
      });
      console.log("🧹 User cartItems cleared");
    } catch (err) {
      console.error("❌ Failed to clear cartItems:", err.message);
    }
    // REMOVE CARTITEMS AFTER PURCHASED PRODUCT ENDS
    res.status(201).json(createdOrder);
  }
});
// @desc get order by id
// @route GET /api/orders/:id
// @access Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate({
      path: "orderItems.product",
      select: "name images", // Include the fields you need
    });
  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Order Not found");
  }
});
// @desc update order to paid
// @route update /api/orders/:id/pay
// @access Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order Not found");
  }
});

// @desc update order to delivered
// @route update /api/orders/:id/deliver
// @access Private
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order Not found");
  }
});
// @desc get logged in user orders
// @route GET /api/orders/myorders
// @access Private
const GetMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate({
    path: "orderItems.product", // Reference to the Product model
    select: "images brandname rating ", // Select only the fields you need
  });
  res.json(orders);
});

// @desc get orders
// @route GET /api/admin/orders
// @access Private/admin
const GetOrders = asyncHandler(async (req, res) => {
  const { status } = req.query; // Get status filter from query params

  let filter = {};
  if (status && status !== "all") {
    filter.status = status; // Apply filter only if status is provided
  }

  const orders = await Order.find(filter).populate("user", "id name").populate({
    path: "orderItems.product",
    select: "brandname images",
  });

  res.json(orders);
});

//@desc Get orders for delivery person
//@route GET/Api/orders/delivery
// access Private Delivery
const getOrdersForDeliveryPerson = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    deliveryPerson: req.user._id,
    isPacked: true,
  }).populate("user", "name email");
  res.json(orders);
});

//@desc Accept order
// @route PUT/api/orders/delivery/accept/:id
// access Private Delivery
const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order && order.isPacked && !order.isAcceptedByDelivery) {
    order.isAcceptedByDelivery = true;
    await order.save();
    try {
      await sendEmail({
        email: order.user.email,
        status: "Shipped",
        orderId: order._id,
      });
      console.log("✅ Shipment email sent");
    } catch (error) {
      console.error("❌ Error sending shipment email:", error.message);
    }
    res.json({ message: "Order accepted" });
  } else {
    res.status(400);
    throw new Error("Order cannot be accepted");
  }
});

// @desc Reject order
//@route PUT/api/orders/delivery/reject/:id
// access Private Delivery
const rejectOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order && order.isPacked && !order.isAcceptedByDelivery) {
    order.deliveryPerson = null; // Remove delivery person assignment
    await order.save();
    res.json({ message: "Order rejected" });
  } else {
    res.status(400);
    throw new Error("Order cannot be rejected");
  }
});

// @desc Mark order as completed
// @route PUT/api/orders/delivery/complete/:id
// access Private Delivery
const markOrderAsCompleted = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order && order.isAcceptedByDelivery && !order.isDelivered) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    if (order.paymentMethod === "COD") {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    await order.save();
    try {
      await sendEmail({
        email: order.user.email,
        status: "Delivered",
        orderId: order._id,
      });
      console.log("✅ Delivery email sent");
    } catch (error) {
      console.error("❌ Error sending delivery email:", error.message);
    }

    res.json({ message: "Order marked as completed" });
  } else {
    res.status(400);
    throw new Error("Order cannot be marked as completed");
  }
});

// @desc Mark order as returned
// @route PUT/api/orders/delivery/return/:id
// access Private Delivery
const markOrderAsReturned = asyncHandler(async (req, res) => {
  const { returnReason } = req.body;
  const order = await Order.findById(req.params.id);
  if (order && order.isDelivered) {
    order.isReturned = true;
    order.returnReason = returnReason;
    await order.save();
    res.json({ message: "Order marked as returned" });
  } else {
    res.status(400);
    throw new Error("Order cannot be marked as returned");
  }
});

// @desc get undelivered orders in admin
// @route GET/api/orders/undelivered
// access Private Admin

const getUndeliveredOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ isDelivered: false }) // Fetch only non-delivered orders
    .populate("user", "name email profilePicture")
    .populate("deliveryPerson", "name profilePicture")
    .populate("orderItems.product", "name images");

  res.json(orders);
});

// @desc Assign order to delivery person
// @route PUT/api/orders/:id/assign
// access Private Admin
const assignOrderToDeliveryPerson = asyncHandler(async (req, res) => {
  const { deliveryPersonId } = req.body;
  const order = await Order.findById(req.params.id)
    .populate("user", "name email profilePicture")
    .populate("deliveryPerson", "name profilePicture")
    .populate("orderItems.product", "name image");
  if (order) {
    order.deliveryPerson = deliveryPersonId;
    order.isPacked = true;
    await order.save();
    res.json({ message: "Order assigned to delivery person" });
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});
// @desc    Generate Invoice
// @route   GET /api/orders/:id/invoice
// @access  Private/Admin
const generateInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (order) {
    const invoice = {
      orderId: order._id,
      user: {
        name: order.user?.name || "N/A",
        email: order.user?.email || "N/A",
      },
      orderItems: order.orderItems,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      taxPrice: order.taxPrice,
      shippingPrice: order.shippingPrice,
      totalPrice: order.totalPrice,
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
    };
    order.invoiceDetails = invoice;
    await order.save();
    res.json(invoice);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});
// @desc  getlocations
// @route   GET /api/incomebycity
// @access  Private/Admin
const incomebycity = asyncHandler(async (req, res) => {
  const orders = await Order.find({ isPaid: true });

  // Calculate total income
  const totalIncome = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  // Format total income
  const formattedTotalIncome = `Rs.${totalIncome}`;

  // Calculate income by city
  const incomeByCity = orders.reduce((acc, order) => {
    const city = order.shippingAddress.city || "Unknown"; // Handle missing city
    acc[city] = (acc[city] || 0) + order.totalPrice;
    return acc;
  }, {});
  res.setHeader("Cache-Control", "no-store");
  res.json({
    totalIncome: formattedTotalIncome,
    incomeByCity: Object.entries(incomeByCity).map(([city, income]) => ({
      city,
      income: `Rs. ${income}`, // Format as $k
    })),
  });
});
// @desc    Fetch transaction details with filters
// @route   GET /api/orders/transactions
// @access  Private/Admin
const getTransactions = asyncHandler(async (req, res) => {
  let { startDate, endDate, paymentType, status } = req.query;

  let query = {};

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (paymentType) {
    query.paymentMethod = paymentType;
  }

  if (status) {
    if (status === "Paid") {
      query.isPaid = true;
    } else if (status === "Unpaid") {
      query.isPaid = false;
    } else if (status === "Delivered") {
      query.isDelivered = true;
    }
  }

  const transactions = await Order.find(query).select(
    "createdAt paymentMethod isPaid isDelivered totalPrice taxPrice shippingPrice orderItems"
  );

  res.json(transactions);
});

// @desc    Stripe payments
// @route   post /api/orders/stripe
// @access  public/users
const StripePayment = asyncHandler(async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Payment Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// @desc    update Trackingststatus
// @route   put /api/orders/:id/updatestatus
// @access  private/admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (order) {
    // Update the correct field based on status
    if (status === "Packed") order.isPacked = true;
    if (status === "Shipped") order.isAcceptedByDelivery = true;
    if (status === "Delivered") order.isDelivered = true;
    if (status === "Returned") order.isReturned = true;

    await order.save();
    res.json({ message: "Order status updated", order });
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});
// @desc   Get order statuses count
// @route  GET /api/orders/status-count
// @access Admin
const getOrderStatusCounts = asyncHandler(async (req, res) => {
  const orderStatuses = await Order.aggregate([
    {
      $group: {
        _id: null,
        pending: { $sum: { $cond: [{ $eq: ["$isPaid", false] }, 1, 0] } },
        confirmed: { $sum: { $cond: [{ $eq: ["$isPaid", true] }, 1, 0] } },
        packaging: { $sum: { $cond: [{ $eq: ["$isPacked", true] }, 1, 0] } },
        outForDelivery: {
          $sum: { $cond: [{ $eq: ["$isAcceptedByDelivery", true] }, 1, 0] },
        },
        delivered: { $sum: { $cond: [{ $eq: ["$isDelivered", true] }, 1, 0] } },
        canceled: {
          $sum: {
            $cond: [{ $eq: ["$returnReason", "Canceled by user"] }, 1, 0],
          },
        },
        returned: { $sum: { $cond: [{ $eq: ["$isReturned", true] }, 1, 0] } },
        failed: {
          $sum: { $cond: [{ $eq: ["$returnReason", "Failed"] }, 1, 0] },
        },
      },
    },
  ]);

  res.json(orderStatuses.length ? orderStatuses[0] : {});
});

// @desc create billing invoice to an order
// @route   POST /api/orders/billinginvoice
// @access  Private/Admin
const createBillingInvoice = asyncHandler(async (req, res) => {
  console.log("Incoming Billing Invoice Request Body:", req.body); // 🐞 log to debug

  const { logo, from, to, invoiceNumber, date, items, notes, signature } =
    req.body;
  // Calculate totals based on items
  const subtotal = items.reduce((sum, item) => sum + item.rate * item.qty, 0);
  const cgstTotal = items.reduce(
    (sum, item) => sum + ((item.cgst || 0) / 100) * item.rate * item.qty,
    0
  );
  const sgstTotal = items.reduce(
    (sum, item) => sum + ((item.sgst || 0) / 100) * item.rate * item.qty,
    0
  );
  const total = subtotal + cgstTotal + sgstTotal;
  const invoice = new BillingInvoice({
    logo,
    from,
    to,
    invoiceNumber,
    date,
    items,
    subtotal,
    cgstTotal,
    sgstTotal,
    total,
    notes,
    signature,
  });

  const createdInvoice = await invoice.save();

  res.status(201).json({
    message: "Billing invoice created successfully",
    invoice: createdInvoice,
  });
});

// @desc    GET billing invoice to an order
// @route   GET /api/:invoiceNumber
// @access  Private/Admin
const getBillingInvoiceByNumber = asyncHandler(async (req, res) => {
  const invoice = await BillingInvoice.findOne({
    invoiceNumber: req.params.invoiceNumber,
  });

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  res.json(invoice);
});
export {
  addorderitems,
  getOrderById,
  updateOrderToPaid,
  GetMyOrders,
  GetOrders,
  updateOrderToDelivered,
  getUndeliveredOrders,
  getOrdersForDeliveryPerson,
  acceptOrder,
  rejectOrder,
  markOrderAsCompleted,
  markOrderAsReturned,
  assignOrderToDeliveryPerson,
  generateInvoice,
  incomebycity,
  getTransactions,
  StripePayment,
  updateOrderStatus,
  getOrderStatusCounts,
  createBillingInvoice,
  getBillingInvoiceByNumber,
};
