import axios from "axios";
import dotenv from "dotenv";
import { getFedExToken } from "./Fedextoken.js";
dotenv.config();

/**
 * Fetch Shipping Rates from FedEx
 **/
const fetchFedExRates = async (
  senderAddress,
  recipientAddress,
  packageDetails
) => {
  // console.log("Sender Address:", senderAddress);
  // console.log("Recipient Address:", recipientAddress);
  // console.log("Package Details:", packageDetails);

  try {
    const token = await getFedExToken();
    const requestBody = {
      accountNumber: {
        value: process.env.FEDEX_ACCOUNT_NUMBER,
      },
      requestedShipment: {
        shipper: { address: senderAddress },
        recipient: { address: recipientAddress },
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
        packagingType: "YOUR_OWN_PACKAGING",
        shipmentSpecialServices: {
          specialServiceTypes: ["COD"],
        },
        rateRequestType: ["LIST", "ACCOUNT"],
        customsClearanceDetail: {
          dutiesPayment: {
            paymentType: "SENDER",
            payor: {
              responsibleParty: null,
            },
          },
          commercialInvoice: {
            shipmentPurpose: "SOLD",
          },
          freightOnValue: "CARRIER_RISK",
          commodities: [
            {
              description: "Clothing",
              weight: {
                value: 1,
                units: "KG",
              },
              quantity: 1,
              quantityUnits: "PCS",
              customsValue: {
                amount: 500,
                currency: "INR",
              },
            },
          ],
        },
        requestedPackageLineItems: [packageDetails],
      },
    };
    // console.log("Sending FedEx Request:", JSON.stringify(requestBody, null, 2));
    const response = await axios.post(
      `${process.env.FEDEX_API_URL}/rate/v1/rates/quotes`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.output.rateReplyDetails;
  } catch (error) {
    console.error(
      "FedEx Rate Fetching Error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch shipping rates from FedEx");
  }
};



export { fetchFedExRates};
