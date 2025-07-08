import { async } from "regenerator-runtime";
import Product from "../models/productModel.js";
import asyncHandler from "express-async-handler";
import path from "path";
import fs from "fs";

// @desc Create add banners
// @route POST /api/banners
// @access Private / Admin
const addBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, productId, gender } = req.body;
  if (!req.file || !title || !subtitle || !productId || !gender) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }
  if (product.banners.length >= 4) {
    return res
      .status(400)
      .json({ message: "Maximum of 3 banners allowed per product." });
  }
  const banner = {
    image: req.file.path,
    title,
    subtitle,
    productId,
    gender,
  };
  product.banners.push(banner);
  await product.save();
  res.status(201).json({ message: "Banner added successfully.", banner });
});

// @desc deleteBanner
// @route delete /api/banners/:id
// @access Private/admin
const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({ "banners._id": id });

  if (!product) {
    return res.status(404).json({ message: "Banner not found." });
  }

  product.banners = product.banners.filter(
    (banner) => banner._id.toString() !== id
  );
  await product.save();

  res.status(200).json({ message: "Banner deleted successfully." });
});

// @desc getBanners
// @route get /api/banners
// @access Private
const getBanners = asyncHandler(async (req, res) => {
  try {
    const { gender } = req.query;
    const productsWithBanners = await Product.find({
      "banners.0": { $exists: true },
    }).select("banners");

    const banners = productsWithBanners.flatMap((product) =>
      product.banners.filter((banner) => ({
        _id: banner._id,
        image: banner.image,
        title: banner.title,
        subtitle: banner.subtitle,
        gender: banner.gender,
        productId: banner.productId,
      }))
    );
    res.status(200).json(banners);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch banners.", error: error.message });
  }
});

// @desc Create addvideobanners
// @route POST /api/videobanners
// @access Private / Admin
const addvideobanner = asyncHandler(async (req, res) => {
  console.log("Received Upload Request"); // ✅ Log request start
  console.log("Request Body:", req.body); // ✅ Log the body
  console.log("Uploaded File:", req.file); // ✅ Log uploaded file
  const { productId } = req.body; // Get productId from request body
  if (!req.file) {
    return res.status(400).json({ message: "No video uploaded." });
  }
  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  // Create video banner object
  const videoBanner = {
    videoUrl: req.file.path,
  };

  // Add the video banner to the product's VideoBanner array
  product.VideoBanner.push(videoBanner);
  await product.save();
  console.log("Video Banner Added Successfully:", videoBanner);
  res
    .status(201)
    .json({ message: "Video banner added successfully", videoBanner });
});
// @desc getvideoBanners
// @route get /api/videobanners
// @access Private
const getvideobanner = asyncHandler(async (req, res) => {
  const { productId } = req.query; // Get productId from request body
  if (productId) {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    console.log("Video banners fetched:", product.VideoBanner); // Log output
    return res.json(product.VideoBanner);
  }

  // If no productId, fetch all video banners
  const products = await Product.find({}, "VideoBanner");
  const allVideoBanners = products.flatMap((product) => product.VideoBanner);

  res.json(allVideoBanners);
});
// @desc deletevideoBanner
// @route delete /api/videobanners/:id
// @access Private/admin

const deletevideobanner = asyncHandler(async (req, res) => {
  const { productId, videoId } = req.params; // Get productId & videoId from URL params

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const videoIndex = product.VideoBanner.findIndex(
    (v) => v._id.toString() === videoId
  );

  if (videoIndex === -1) {
    return res.status(404).json({ message: "Video banner not found" });
  }

  // Remove video file from the server
  const videoPath = path.join(
    "uploads",
    product.VideoBanner[videoIndex].videoUrl.split("/").pop()
  );

  if (fs.existsSync(videoPath)) {
    fs.unlinkSync(videoPath);
  }

  // Remove the video from the array
  product.VideoBanner.splice(videoIndex, 1);
  await product.save();

  res.json({ message: "Video banner deleted successfully" });
});
// @desc getallvideoBanners
// @route get /api/allvideobanners
// @access Private
const getUserVideoBanners = asyncHandler(async (req, res) => {
  // Find all products and extract video banners
  const products = await Product.find({}, "VideoBanner");

  // Flatten all video banners into a single array
  const allVideoBanners = products.flatMap((product) => product.VideoBanner);

  res.json(allVideoBanners);
});

export {
  addBanner,
  deleteBanner,
  getBanners,
  addvideobanner,
  getvideobanner,
  deletevideobanner,
  getUserVideoBanners,
};
