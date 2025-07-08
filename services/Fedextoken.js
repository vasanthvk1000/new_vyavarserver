import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * Get FedEx OAuth Token
 **/
const getFedExToken = async () => {
  console.log("FedEx Auth URL:", process.env.FEDEX_AUTH_URL);
  console.log("FedEx Client ID:", process.env.FEDEX_CLIENT_ID);
  console.log(
    "FedEx Client Secret:",
    process.env.FEDEX_CLIENT_SECRET ? "Present" : "Missing"
  );
  console.log("FedEx Account Number:", process.env.FEDEX_ACCOUNT_NUMBER);

  try {
    const response = await axios.post(
      process.env.FEDEX_AUTH_URL,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.FEDEX_CLIENT_ID,
        client_secret: process.env.FEDEX_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error(
      "FedEx Authentication Error:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to authenticate with FedEx API: ${
        error.response?.data?.errors || error.message
      }`
    );
  }
};

export { getFedExToken };
