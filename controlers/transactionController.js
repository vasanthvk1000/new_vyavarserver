import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";

/**
 * @desc    Delivery Person Requests a Deposit
 * @route   POST /api/delivery/deposit
 * @access  Private (Delivery)
 */
const requestDeposit = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;
  const deliveryPersonId = req.user._id;

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Check if delivery person is assigned to this order
  if (order.deliveryPerson.toString() !== deliveryPersonId.toString()) {
    res.status(403);
    throw new Error("Not authorized to deposit for this order");
  }

  order.transaction.push({
    deliveryPerson: deliveryPersonId,
    type: "deposit",
    amount,
    status: "pending",
  });

  await order.save();
  res.status(201).json({ message: "Deposit request submitted" });
});

/**
 * @desc    Get all pending deposits (Admin)
 * @route   GET /api/admin/pending-deposits
 * @access  Private (Admin)
 */
const getPendingDeposits = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    "transaction.type": "deposit",
    "transaction.status": "pending",
  })
    .populate("user", "name email")
    .populate("deliveryPerson", "name email")
    .populate("transaction.deliveryPerson", "name email");

  const pendingDeposits = [];

  orders.forEach((order) => {
    order.transaction.forEach((tx) => {
      if (tx.type === "deposit" && tx.status === "pending") {
        pendingDeposits.push({
          ...tx.toObject(),
          orderId: order._id,
          orderNumber: order._id.toString().substring(18, 24),
          customerName: order.user?.name,
          deliveryPersonName: order.deliveryPerson?.name,
        });
      }
    });
  });

  res.json(pendingDeposits);
});

/**
 * @desc    Admin Confirms Deposit
 * @route   PUT /api/admin/confirm-deposit/:orderId/:transactionId
 * @access  Private (Admin)
 */
const confirmDeposit = asyncHandler(async (req, res) => {
  const { orderId, transactionId } = req.params;

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const transaction = order.transaction.id(transactionId);

  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  if (transaction.type !== "deposit") {
    res.status(400);
    throw new Error("Not a deposit transaction");
  }

  transaction.status = "approved";
  transaction.approvedBy = req.user._id;

  // Update delivery person's balance
  const deliveryPerson = await User.findById(transaction.deliveryPerson);
  if (deliveryPerson) {
    deliveryPerson.balance = (deliveryPerson.balance || 0) + transaction.amount;
    await deliveryPerson.save();
  }

  await order.save();
  res.json({ message: "Deposit approved" });
});

/**
 * @desc    Delivery Person Requests Withdrawal
 * @route   POST /api/delivery/request-withdraw
 * @access  Private (Delivery)
 */
const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;
  const deliveryPersonId = req.user._id;

  // Check if delivery person has sufficient balance
  const deliveryPerson = await User.findById(deliveryPersonId);
  if ((deliveryPerson.balance || 0) < amount) {
    res.status(400);
    throw new Error("Insufficient balance for withdrawal");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Check if delivery person is assigned to this order
  if (order.deliveryPerson.toString() !== deliveryPersonId.toString()) {
    res.status(403);
    throw new Error("Not authorized to withdraw for this order");
  }

  order.transaction.push({
    deliveryPerson: deliveryPersonId,
    type: "withdrawal",
    amount,
    status: "pending",
  });

  await order.save();
  res.status(201).json({ message: "Withdrawal request submitted" });
});

/**
 * @desc    Get all pending withdrawals (Admin)
 * @route   GET /api/admin/pending-withdrawals
 * @access  Private (Admin)
 */
const getPendingWithdrawals = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    "transaction.type": "withdrawal",
    "transaction.status": "pending",
  })
    .populate("user", "name email")
    .populate("deliveryPerson", "name email")
    .populate("transaction.deliveryPerson", "name email");

  const pendingWithdrawals = [];

  orders.forEach((order) => {
    order.transaction.forEach((tx) => {
      if (tx.type === "withdrawal" && tx.status === "pending") {
        pendingWithdrawals.push({
          ...tx.toObject(),
          orderId: order._id,
          orderNumber: order._id.toString().substring(18, 24),
          customerName: order.user?.name,
          deliveryPersonName: order.deliveryPerson?.name,
        });
      }
    });
  });

  res.json(pendingWithdrawals);
});

/**
 * @desc    Admin Approves Withdrawal
 * @route   PUT /api/admin/approve-withdraw/:orderId/:transactionId
 * @access  Private (Admin)
 */
const approveWithdrawal = asyncHandler(async (req, res) => {
  const { orderId, transactionId } = req.params;

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const transaction = order.transaction.id(transactionId);

  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  if (transaction.type !== "withdrawal") {
    res.status(400);
    throw new Error("Not a withdrawal transaction");
  }

  // Check delivery person's balance
  const deliveryPerson = await User.findById(transaction.deliveryPerson);
  if ((deliveryPerson.balance || 0) < transaction.amount) {
    res.status(400);
    throw new Error("Delivery person has insufficient balance");
  }

  // Deduct from balance
  deliveryPerson.balance = (deliveryPerson.balance || 0) - transaction.amount;
  await deliveryPerson.save();

  transaction.status = "approved";
  transaction.approvedBy = req.user._id;

  await order.save();
  res.json({ message: "Withdrawal approved" });
});

/**
 * @desc    Admin Rejects Withdrawal
 * @route   PUT /api/admin/reject-withdraw/:orderId/:transactionId
 * @access  Private (Admin)
 */
const rejectWithdrawal = asyncHandler(async (req, res) => {
  const { orderId, transactionId } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const transaction = order.transaction.id(transactionId);

  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  if (transaction.type !== "withdrawal") {
    res.status(400);
    throw new Error("Not a withdrawal transaction");
  }

  transaction.status = "rejected";
  transaction.rejectionReason = reason;
  transaction.approvedBy = req.user._id;

  await order.save();
  res.json({ message: "Withdrawal rejected" });
});

/**
 * @desc    Get delivery person's transactions
 * @route   GET /api/delivery/my-transactions
 * @access  Private (Delivery)
 */
const getMyTransactions = asyncHandler(async (req, res) => {
  const deliveryPersonId = req.user._id;

  const orders = await Order.find({
    "transaction.deliveryPerson": deliveryPersonId,
  })
    .populate("user", "name")
    .sort("-createdAt");

  const transactions = [];

  orders.forEach((order) => {
    order.transaction.forEach((tx) => {
      if (tx.deliveryPerson.toString() === deliveryPersonId.toString()) {
        transactions.push({
          ...tx.toObject(),
          orderId: order._id,
          orderNumber: order._id.toString().substring(18, 24),
          customerName: order.user?.name,
          createdAt: tx.createdAt,
        });
      }
    });
  });

  // Sort transactions by date (newest first)
  transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(transactions);
});

export {
  requestDeposit,
  getPendingDeposits,
  confirmDeposit,
  requestWithdrawal,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getMyTransactions,
};
