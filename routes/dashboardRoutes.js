import express from "express";
import {
  getSalesData,
  getRevenueData,
  getLatestOrders,
  getTotalOrders,
} from "../controlers/dashboardController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/orders", protect, admin, getLatestOrders);
router.get("/revenue", protect, admin, getRevenueData);
router.get("/sales", protect, admin, getSalesData);
router.get("/getTotalOrders", protect, admin, getTotalOrders);

export default router;
