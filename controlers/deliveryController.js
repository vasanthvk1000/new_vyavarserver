import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import { fetchFedExRates } from "../services/FedexShippingcharge.js";
import { createfedexshipment } from "../services/FedexShipment.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";

// get shipment rates
// @route   get/api/felivery/fedex-rates
// @access  Public
const shipmentrates = asyncHandler(async (req, res) => {
  const { userAddress, productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  const senderAddress = {
    postalCode: product.shippingDetails.originAddress.zip,
    countryCode: product.shippingDetails.originAddress.country,
  };
  const recipientAddress = {
    postalCode: userAddress.zip,
    countryCode: userAddress.country,
  };
  const packageDetails = {
    weight: {
      units: "KG",
      value: product.shippingDetails.weight,
    },
  };
  const rates = await fetchFedExRates(
    senderAddress,
    recipientAddress,
    packageDetails
  );
  // console.log("✅ FedEx API Response (Rates):", JSON.stringify(rates, null, 2)); // DEBUG LOG

  res.json(rates);
});

// create  Assign to delivery
// @route   POST/api/delivery/createShipment
// @access  Public
const createShipment = asyncHandler(async (req, res) => {
  const {
    recipientName,
    street,
    city,
    nearestLandmark,
    postalCode,
    countryCode,
    productId,
    totalPrice,
  } = req.body;
  console.log("Incoming Request Body:", req.body);
  // Validate required fields
  // Validate required fields
  if (
    !recipientName ||
    !street ||
    !city ||
    !postalCode ||
    !countryCode ||
    !productId ||
    !nearestLandmark ||
    !totalPrice
  ) {
    console.error("❌ Missing shipment details!");
    return res.status(400).json({ message: "Missing shipment details" });
  }
  // get recipient phoneNumber
  const user = await User.findById(req.user._id);
  if (!user) {
    console.error("❌ User not found:", req.user._id);
    return res.status(404).json({ message: "User not found" });
  }
  console.log("✅ User Retrieved:", user);

  const phoneNumber = user.address?.phoneNumber;
  const stateOrProvinceCode = user.address?.state;
  if (!phoneNumber || !stateOrProvinceCode) {
    console.error("❌ Missing recipient phone number or state.");
    return res.status(400).json({ message: "Incomplete recipient address" });
  }
  console.log("📞 Recipient Phone Number:", phoneNumber);
  console.log("🏛 State Code:", stateOrProvinceCode);

  // Fetch product details
  const product = await Product.findById(productId).populate(
    "user",
    "name address.phoneNumber"
  );
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  console.log("✅ Retrieved Product with User Details:", product);

  const senderDetails = {
    contact: {
      personName: product.user.name,
      phoneNumber: product.user.address?.phoneNumber,
    },
    address: {
      streetLines: [
        product.shippingDetails.originAddress.street1,
        product.shippingDetails.originAddress.street2 || "",
      ],
      city: product.shippingDetails.originAddress.city,
      stateOrProvinceCode: product.shippingDetails.originAddress.state,
      postalCode: product.shippingDetails.originAddress.zip,
      countryCode: product.shippingDetails.originAddress.country,
    },
  };
  console.log("✅ Sender Details:", senderDetails);

  const recipientDetails = {
    contact: {
      personName: recipientName,
      phoneNumber: phoneNumber,
    },
    address: {
      streetLines: [street, nearestLandmark],
      city,
      stateOrProvinceCode: user.address.state,
      postalCode,
      countryCode: "IN",
    },
  };
  console.log("✅ Recipient Details:", recipientDetails);

  // Package details
  const packageDetails = {
    weight: {
      units: "KG",
      value: product.shippingDetails.weight,
    },
  };
  console.log("✅ Package Details:", packageDetails);
  console.log("💰 Total Price for Shipment:", totalPrice);

  // Call FedEx Shipment service with prepared data
  try {
    const shipmentData = await createfedexshipment(
      senderDetails,
      recipientDetails,
      packageDetails,
      totalPrice
    );
    console.log(
      "✅ FedEx Shipment Created Successfully:",
      JSON.stringify(shipmentData, null, 2)
    );
    const trackingNumber =
      shipmentData.trackingNumber ||
      shipmentData.output?.transactionShipments?.[0]?.masterTrackingNumber ||
      shipmentData.output?.transactionShipments?.[0]?.pieceResponses?.[0]
        ?.trackingNumber ||
      "N/A"; // Default if tracking number not found

    const shippingLabelUrl =
      shipmentData.shippingLabelUrl ||
      shipmentData.output?.transactionShipments?.[0]?.pieceResponses?.[0]
        ?.packageDocuments?.[0]?.url ||
      "N/A"; // Default if shipping label URL not found
    res.status(200).json({
      success: true,
      data: {
        trackingNumber,
        shippingLabelUrl,
        shipmentStatus: "Pending",
        senderDetails,
        recipientDetails,
        packageDetails,
      },
    });
  } catch (error) {
    console.error(
      "❌ FedEx Shipment Error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Failed to create FedEx shipment",
      error: error.message,
    });
  }
});
export { shipmentrates, createShipment };
