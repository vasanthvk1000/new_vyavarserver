import express from "express";
const router = express.Router();
import {
  createShipment,
  shipmentrates,
} from "../controlers/deliveryController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

router.route("/shipmentrates").post(protect, shipmentrates);
router.route("/createShipment").post(protect, createShipment);

export default router;
