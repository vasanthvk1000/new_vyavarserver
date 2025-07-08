import axios from "axios";
import dotenv from "dotenv";
import { getFedExToken } from "./Fedextoken.js";
dotenv.config();

// Create Shipment through Fedex
const createfedexshipment = async (
  senderDetails,
  recipientDetails,
  packageDetails,
  totalPrice
) => {
  console.log("🔥 Sending Request to FedEx API...");
  console.log("📦 Sender Address:", JSON.stringify(senderDetails, null, 2));
  console.log(
    "📦 Recipient Address:",
    JSON.stringify(recipientDetails, null, 2)
  );
  console.log("📦 Package Details:", JSON.stringify(packageDetails, null, 2));
  console.log("💰 Order Total Price:", totalPrice);

  try {
    const token = await getFedExToken();
    console.log("🔑 FedEx Token Received:", token);
    const requestBody = {
      labelResponseOptions: "URL_ONLY",
      requestedShipment: {
        shipper: senderDetails,
        recipients: [recipientDetails],
        shipDatestamp: "2025-02-28",
        serviceType: "STANDARD_OVERNIGHT",
        packagingType: "YOUR_PACKAGING",
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
        blockInsightVisibility: false,
        shippingChargesPayment: {
          paymentType: "SENDER",
        },
        shipmentSpecialServices: {
          specialServiceTypes: ["DELIVERY_ON_INVOICE_ACCEPTANCE", "COD"],
          shipmentCODDetail: {
            codCollectionAmount: {
              amount: totalPrice,
              currency: "INR",
            },
            codCollectionType: "CASH",
            codRecipient: recipientDetails,
          },
          deliveryOnInvoiceAcceptanceDetail: {
            recipient: recipientDetails,
          },
        },
        labelSpecification: {
          imageType: "PDF",
          labelStockType: "PAPER_85X11_TOP_HALF_LABEL",
        },
        customsClearanceDetail: {
          isDocumentOnly: false,
          dutiesPayment: {
            paymentType: "SENDER",
          },
          commercialInvoice: {
            shipmentPurpose: "SOLD",
          },
          freightOnValue: "CARRIER_RISK",
          commodities: [
            {
              description: "Clothing",
              countryOfManufacture: "IN",
              weight: packageDetails.weight,
              quantity: 1,
              quantityUnits: "PCS",
              unitPrice: {
                amount: totalPrice,
                currency: "INR",
              },
              customsValue: {
                amount: totalPrice,
                currency: "INR",
              },
            },
          ],
        },
        requestedPackageLineItems: [packageDetails],
      },
      accountNumber: {
        value: process.env.FEDEX_ACCOUNT_NUMBER,
      },
    };
    console.log("🚀 FedEx Request Body:", JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      `${process.env.FEDEX_SHIP_API_URL}/ship/v1/shipments`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ FedEx Response:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ FedEx API Error:", error.response?.data || error.message);
    throw new Error("Failed to create shipment from FedEx");
  }
};

export { createfedexshipment };
