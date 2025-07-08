import express from "express";
const router = express.Router();
import {
  addorderitems,
  GetMyOrders,
  getOrderById,
  GetOrders,
  updateOrderToPaid,
  updateOrderToDelivered,
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
  getUndeliveredOrders,
  updateOrderStatus,
  getOrderStatusCounts,
  createBillingInvoice,
  getBillingInvoiceByNumber,
} from "../controlers/orderControler.js";
import { protect, admin, isDelivery } from "../middleware/authMiddleware.js";


router.route("/delivery").get(protect, isDelivery, getOrdersForDeliveryPerson);

router.route("/status-count").get(protect, admin, getOrderStatusCounts);

// userroutes
router.route("/transactions").get(protect, admin, getTransactions);

// user routes
router.route("/myorders").get(protect, GetMyOrders);
router.route("/").post(protect, addorderitems).get(protect, admin, GetOrders);
router.route("/:id/pay").put(protect, updateOrderToPaid);
router.route("/:id/deliver").put(protect, admin, updateOrderToDelivered);
router.route("/stripePayment").post(protect, StripePayment);
router.route("/:id").get(protect, getOrderById);

// Delivery person routes
router.route("/delivery/accept/:id").put(protect, isDelivery, acceptOrder);
router.route("/delivery/reject/:id").put(protect, isDelivery, rejectOrder);
router
  .route("/delivery/complete/:id")
  .put(protect, isDelivery, markOrderAsCompleted);
router
  .route("/delivery/return/:id")
  .put(protect, isDelivery, markOrderAsReturned);

// admin routes
router.route("/undelivered").get(protect, admin, getUndeliveredOrders);
router.route("/:id/updateorderstatus").put(protect, admin, updateOrderStatus);

router
  .route("/admin/orders/assign/:id")
  .put(protect, admin, assignOrderToDeliveryPerson);
router.route("/admin/order/:id/invoice").get(protect, generateInvoice);
router.route("/admin/incomebycity").get(protect, admin, incomebycity);
router.route("/billinginvoice").post(protect, admin, createBillingInvoice);
router.route("/:invoiceNumber").get(protect, admin, getBillingInvoiceByNumber);

export default router;
