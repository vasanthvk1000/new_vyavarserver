import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", //relation betwen the review and the user
    },
    approved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const bannerSchema = mongoose.Schema(
  {
    image: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    gender: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
const videoBannerSchema = mongoose.Schema(
  {
    videoUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", //relation betwen the product and the user
    },
    brandname: {
      type: String,
      required: true,
    },
    SKU: { type: String, unique: true, required: true },
    images: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
      required: true,
    },
    productdetails: {
      gender: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      subcategory: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      ageRange: {
        type: String,
        required: true,
      },
      color: {
        type: String,
        required: true,
      },
      fabric: {
        type: String,
        required: true,
      },
      sizes: {
        type: [String],
        required: true,
      },
    },
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    oldPrice: {
      type: Number,
      default: 0, // Optional, can be left blank if no discount
    },
    discount: {
      type: Number,
      default: 0, // Percentage discount (e.g., 20 for 20%)
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    banners: [bannerSchema],
    VideoBanner: [videoBannerSchema],
    shippingDetails: {
      weight: {
        type: Number,
        required: true,
      },
      dimensions: {
        length: { type: Number, required: true }, // Length in inches/cm
        width: { type: Number, required: true }, // Width in inches/cm
        height: { type: Number, required: true }, // Height in inches/cm
      },
      originAddress: {
        street1: { type: String, required: true },
        street2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: Number, required: true },
        country: { type: String, required: true },
      },
    },
    isFeatured: { type: Boolean, default: false },
    sizeChart: {
      type: String, // This will store the PDF file path/URL
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
