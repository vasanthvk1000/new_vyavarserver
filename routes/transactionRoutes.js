import express from "express";
const router = express.Router();
import {
  requestDeposit,
  requestWithdrawal,
  getMyTransactions,
  rejectWithdrawal,
  getPendingDeposits,
  confirmDeposit,
  getPendingWithdrawals,
  approveWithdrawal,
} from "../controlers/transactionController.js";
import { protect, admin, isDelivery } from "../middleware/authMiddleware.js";
// Delivery Person Routes
router.route("/delivery/deposit").post(protect, isDelivery, requestDeposit);

router
  .route("/delivery/request-withdraw")
  .post(protect, isDelivery, requestWithdrawal);

router
  .route("/delivery/my-transactions")
  .get(protect, isDelivery, getMyTransactions);

// Admin Routes
router.route("/admin/pending-deposits").get(protect, admin, getPendingDeposits);

router
  .route("/admin/confirm-deposit/:orderId/:transactionId")
  .put(protect, admin, confirmDeposit);


router
  .route("/admin/pending-withdrawals")
  .get(protect, admin, getPendingWithdrawals);


router
  .route("/admin/approve-withdraw/:orderId/:transactionId")
  .put(protect, admin, approveWithdrawal);
router
  .route("/admin/reject-withdraw/:orderId/:transactionId")
  .put(protect, admin, rejectWithdrawal);

export default router;
