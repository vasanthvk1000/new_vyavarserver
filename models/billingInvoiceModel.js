import mongoose from "mongoose";

const billingInvoiceSchema = mongoose.Schema(
  {
    logo: { type: String },

    from: {
      name: String,
      businessName: String,
      email: String,
      address: String,
      phone: String,
      businessNumber: String,
    },

    to: {
      name: String,
      email: String,
      address: String,
      phone: String,
      mobile: String,
      fax: String,
    },

    invoiceNumber: { type: String, required: true },
    date: { type: Date, required: true },

    items: [
      {
        description: { type: String, required: true },
        rate: { type: Number, required: true },
        qty: { type: Number, required: true },
        cgst: { type: Number },
        sgst: { type: Number },
        amount: { type: Number, required: true },
      },
    ],

    subtotal: { type: Number },
    cgstTotal: { type: Number },
    sgstTotal: { type: Number },
    total: { type: Number },

    notes: { type: String },
    signature: { type: String },
  },
  { timestamps: true }
);

const BillingInvoice = mongoose.model("BillingInvoice", billingInvoiceSchema);
export default BillingInvoice;
