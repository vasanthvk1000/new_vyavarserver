import mongoose from "mongoose";
const shippingRateSchema = mongoose.Schema(
  {
    serviceType: { type: String, required: true },
    totalNetCharge: { type: Number, required: true },
    estimatedDeliveryDate: { type: String, default: "N/A" },
    currency: { type: String, default: "USD" },
  },
  { timestamps: true }
);
const transactionSchema = mongoose.Schema(
  {
    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdrawal"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);
const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Relation to delivery person
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
      },
    ],
    shippingAddress: {
      doorNo: { type: Number, default: null },
      street: { type: String, default: "" },
      nearestLandmark: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pin: { type: Number, default: "" },
      country: { type: String, default: "" },
      // phoneNumber: { type: Number, required: true }, // New field
      phoneNumber: { type: Number, default: null },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_adress: { type: String },
    },
    shippingRates: { type: [shippingRateSchema], default: [] },
    taxPrice: {
      type: Number,
      required: true,
    },
    shippingPrice: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },

    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    isPacked: {
      type: Boolean,
      required: true,
      default: false,
    },
    isAcceptedByDelivery: {
      type: Boolean,
      default: false,
    },
    isReturned: {
      type: Boolean,
      default: false,
    },
    returnReason: {
      type: String,
    },
    invoiceDetails: {
      type: Object,
      default: null,
    },
    transaction: { type: [transactionSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
