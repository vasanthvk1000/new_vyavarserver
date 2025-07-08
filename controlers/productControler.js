import asyncHandler from "express-async-handler";
import multer from "multer";
import XLSX from "xlsx";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

// @desc Fetch all products
// @route GET /api/products
// @access Public
const getProducts = asyncHandler(async (req, res) => {
  const {
    brandname,
    gender,
    offerfilter,
    category,
    subcategory,
    type,
    color,
    fabric,
    sizes,
    from,
    to,
    discount,
    rating,
    sortBy,
    keyword,
  } = req.query;
  const keywordFilter = keyword
    ? {
        $or: [
          { brandname: { $regex: keyword, $options: "i" } }, // Search in brandname
          { "productdetails.category": { $regex: keyword, $options: "i" } }, // Search in category
          { "productdetails.subcategory": { $regex: keyword, $options: "i" } }, // Search in subcategory
          { "productdetails.color": { $regex: keyword, $options: "i" } }, // Search in color
          { "productdetails.fabric": { $regex: keyword, $options: "i" } }, // Search in fabric
          { "productdetails.type": { $regex: keyword, $options: "i" } }, // Search in type
        ],
      }
    : {};
  let filterCriteria = {
    ...keywordFilter,
  };
  if (brandname) filterCriteria.brandname = brandname;
  if (gender) filterCriteria["productdetails.gender"] = gender;
  if (category) filterCriteria["productdetails.category"] = category;
  if (subcategory) filterCriteria["productdetails.subcategory"] = subcategory;
  if (type) filterCriteria["productdetails.type"] = type;
  if (color) filterCriteria["productdetails.color"] = color;
  if (fabric) filterCriteria["productdetails.fabric"] = fabric;
  if (sizes) filterCriteria["productdetails.sizes"] = sizes;
  if (offerfilter) {
    switch (offerfilter) {
      case "under499":
        filterCriteria.price = { $lte: 499 };
        break;
      case "under1499":
        filterCriteria.price = { $lte: 1499 };
        break;
      case "upto50":
        filterCriteria.discount = { $gte: 50 };
        break;
      case "upto70":
        filterCriteria.discount = { $gte: 70 };
        break;
      default:
        console.log("Invalid Offer Filter");
    }
  }
  console.log("Final Filter Criteria:", filterCriteria);
  // Price Range Filter
  if (from && to) {
    filterCriteria.price = { $gte: from, $lte: to };
  } else if (from) {
    filterCriteria.price = { $gte: from };
  } else if (to) {
    filterCriteria.price = { $lte: to };
  }
  // Discount Filter
  if (discount) {
    filterCriteria.discount = { $gte: discount }; // Get products with at least this discount
  }

  // Rating Filter
  if (rating) {
    filterCriteria.rating = { $gte: rating }; // Get products with at least this rating
  }

  // Sorting Logic
  let sortOptions = {};
  switch (sortBy) {
    case "Rating":
      sortOptions.rating = -1;
      break;
    case "date":
      sortOptions.createdAt = -1;
      break;
    case "highprice":
      sortOptions.price = -1;
      break;
    case "lowprice":
      sortOptions.price = 1;
      break;
    default:
      sortOptions.createdAt = -1; // Default: Newest first
  }

  // Fetch Products
  const products = await Product.find(filterCriteria).sort(sortOptions);

  res.json(products);
});

// @desc Fetch single  product
// @route GET /api/products/:id
// @access Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product);
  } else {
    // status it's 500 by default cuz of errHandler
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc add to cart product
// @route post /api/products/addtocart
// @access Private

const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { qty } = req.body;
  const product = await Product.findById(req.params.id);
  const user = await User.findById(userId).populate("cartItems.product");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  } else {
    // Find existing cart item
    const existingCartItem = user.cartItems.find(
      (item) => item.product._id.toString() === product._id.toString()
    );

    if (existingCartItem) {
      // Update quantity if item exists
      existingCartItem.qty = qty;
      existingCartItem.price = qty * product.price;
    } else {
      // Add new item to cart if it doesn't exist
      user.cartItems.push({ product, qty, price: qty * product.price });
    }
  }
  await user.save();
  const updatedCart = await User.findById(userId).populate("cartItems.product");
  res.status(200).json(updatedCart);
});
// @desc get cart product
// @route get /api/products/getcart
// @access Private
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId).populate("cartItems.product");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json(user.cartItems);
});

// @desc detlete cart product
// @route delete /api/products/deletecart
// @access Private

const deleteCartItem = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Logged-in user's ID
  const { cartItemId } = req.params; // Cart item ID to delete

  console.log("Cart Item ID from request:", cartItemId);

  // Use MongoDB's $pull operator to remove the item by its `_id`
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $pull: { cartItems: { _id: cartItemId } }, // Match by cart item `_id`
    },
    { new: true } // Return the updated document
  ).populate("cartItems.product"); // Populate product details after update

  if (!updatedUser) {
    res.status(404);
    throw new Error("User not found");
  }

  console.log("Updated Cart Items:", updatedUser.cartItems);

  // Send the updated cart back to the client
  res.status(200).json(updatedUser);
});
// @desc Delete a product
// @route GET /api/products/:id
// @access Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product Removed" });
  } else {
    // status it's 500 by default cuz of errHandler
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc Create a product
// @route Post /api/products
// @access Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    brandname,
    price,

    description,
    productdetails,
    countInStock,
    discount,
    oldPrice,
    SKU,
    shippingDetails,
    isFeatured,
  } = req.body;
  if (!req.files || (!req.files["images"] && !req.files["sizeChart"])) {
    res.status(400).json({ message: "No files uploaded" });
    return;
  }
  const images = req.files["images"]?.map((file) => file.path) || [];
  const sizeChart = req.files["sizeChart"]?.[0]?.path || "";

  //  console.log("📄 Uploaded sizeChart:", sizeChart);

  const parsedProductDetails =
    typeof productdetails === "string"
      ? JSON.parse(productdetails)
      : productdetails;
  const {
    gender,
    category,
    subcategory,
    type,
    ageRange,
    color,
    fabric,
    sizes,
  } = parsedProductDetails;
  // Ensure sizes is an array (in case it's sent as a string)
  const formattedSizes = Array.isArray(sizes) ? sizes : sizes.split(",");

  const parsedShippingDetails =
    typeof shippingDetails === "string"
      ? JSON.parse(shippingDetails)
      : shippingDetails;
  const completeShippingDetails = {
    weight: parsedShippingDetails.weight,
    dimensions: {
      length: parsedShippingDetails.dimensions.length,
      width: parsedShippingDetails.dimensions.width,
      height: parsedShippingDetails.dimensions.height,
    },
    originAddress: {
      street1: parsedShippingDetails.originAddress.street1,
      street2: parsedShippingDetails.originAddress.street2,
      city: parsedShippingDetails.originAddress.city,
      state: parsedShippingDetails.originAddress.state,
      zip: parsedShippingDetails.originAddress.zip,
      country: parsedShippingDetails.originAddress.country,
    },
  };

  // Extract fields from productdetails
  const product = new Product({
    brandname,
    price,
    oldPrice,
    discount,
    description,
    user: req.user._id,
    images,
    sizeChart,
    SKU,
    productdetails: {
      gender,
      category,
      subcategory,
      type,
      ageRange,
      color,
      fabric,
      sizes: formattedSizes,
    },
    shippingDetails: completeShippingDetails,
    countInStock,
    numReviews: 0,
    isFeatured,
  });
  console.log("product details", product);
  const createProduct = await product.save();
  res.status(201).json(createProduct);
});

// @desc Update a product
// @route PUT /api/products/:id
// @access Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  try {
    const {
      brandname,
      price,
      productdetails,
      description,
      oldPrice,
      discount,
      SKU,
      shippingDetails,
      isFeatured,
      countInStock,
    } = req.body;

    console.log("Received request body:", req.body);

    let parsedProductDetails = {};
    if (productdetails) {
      try {
        parsedProductDetails =
          typeof productdetails === "string"
            ? JSON.parse(productdetails)
            : productdetails;
      } catch (error) {
        console.error("Error parsing product details:", error);
        return res
          .status(400)
          .json({ message: "Invalid product details format" });
      }
    }
    const parsedShippingDetails =
      typeof shippingDetails === "string"
        ? JSON.parse(shippingDetails)
        : shippingDetails;
    const completeShippingDetails = {
      weight: parsedShippingDetails.weight,
      dimensions: {
        length: parsedShippingDetails.dimensions.length,
        width: parsedShippingDetails.dimensions.width,
        height: parsedShippingDetails.dimensions.height,
      },
      originAddress: {
        street1: parsedShippingDetails.originAddress.street1,
        street2: parsedShippingDetails.originAddress.street2,
        city: parsedShippingDetails.originAddress.city,
        state: parsedShippingDetails.originAddress.state,
        zip: parsedShippingDetails.originAddress.zip,
        country: parsedShippingDetails.originAddress.country,
      },
    };
    const {
      gender = "",
      category = "",
      subcategory = "",
      type = "",
      ageRange = "",
      color = "",
      fabric = "",
      sizes = [],
    } = parsedProductDetails;
    // Ensure sizes is an array (fixes the `.split is not a function` error)
    const formattedSizes =
      typeof sizes === "string" ? sizes.split(",").map((s) => s.trim()) : sizes;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.brandname = brandname;
      product.price = price;
      product.description = description;
      product.productdetails = {
        gender,
        category,
        subcategory,
        type,
        ageRange,
        color,
        fabric,
        sizes: formattedSizes,
      };
      product.countInStock = countInStock;
      product.shippingDetails = completeShippingDetails;
      product.SKU = SKU;
      product.isFeatured = isFeatured;
      product.oldPrice = oldPrice;
      product.discount = discount;

      // Handle file updates
      if (req.files) {
        // Update images if new ones are uploaded
        if (req.files["images"]) {
          product.images = req.files["images"].map((file) => file.path);
        }

        // Update size chart if new PDF is uploaded
        if (req.files["sizeChart"]) {
          product.sizeChart = req.files["sizeChart"][0].path;
        }
      }

      const updatedProduct = await product.save();
      console.log("Updated product:", updatedProduct);
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error. Could not update product" });
  }
});

// @desc Create a bulk product
// @route Post /api/products
// @access Private/Admin

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

const uploadProducts = asyncHandler(async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "File upload failed" });
    }

    const file = req.file;

    // ✅ Validate file extension
    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      return res.status(400).json({ message: "Only Excel files are allowed" });
    }

    // ✅ Read and Parse Excel file
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // ✅ Validate and Process Data
    const products = [];

    for (const row of sheetData) {
      if (!row.brandname || !row.countInStock || !row.productdetails) {
        return res.status(400).json({ message: "Invalid data in Excel file" });
      }

      // ✅ Parse `productdetails`
      let parsedProductDetails;
      try {
        parsedProductDetails =
          typeof row.productdetails === "string"
            ? JSON.parse(row.productdetails) // Parse if it's a JSON string
            : row.productdetails;
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Invalid productdetails format" });
      }

      // ✅ Destructure product details correctly
      const {
        gender,
        category,
        subcategory,
        type,
        ageRange,
        color,
        fabric,
        sizes,
      } = parsedProductDetails;
      const oldPrice = parseFloat(row.oldPrice);
      const discount = parseFloat(row.discount);
      const calculatedPrice = oldPrice - (oldPrice * discount) / 100;
      products.push({
        user: req.user._id,
        brandname: row.brandname,
        price: calculatedPrice.toFixed(2),
        oldPrice: row.oldPrice,
        discount: row.discount,
        description: row.description,
        countInStock: row.countInStock,
        images: row.images ? row.images.split(",") : [],
        productdetails: {
          gender,
          category,
          subcategory,
          type,
          ageRange,
          color,
          fabric,
          sizes,
        },
      });
    }

    // ✅ Insert products into the database
    try {
      await Product.insertMany(products);
      res.status(201).json({ message: "Products uploaded successfully!" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error inserting products into database", error });
    }
  });
});

// @desc Create new Review
// @route PUT /api/products/:id/reviews
// @access Private
const createproductreview = asyncHandler(async (req, res) => {
  console.log("Incoming Review Request:", req.body);
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      res.status(404);
      throw new Error("Product Already Review");
    }
    if (!product) {
      console.log("❌ Product not found");
      return res.status(404).json({ message: "Product not found" });
    }
    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
      approved: false,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;
    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Product Not found");
  }
});

// @desc Approve Review
// @route PUT /api/products/approve review
// @access Private

const approveReview = asyncHandler(async (req, res) => {
  console.log(
    "🔍 Approving Review - Product ID:",
    req.params.id,
    "Review ID:",
    req.params.reviewId
  );

  const product = await Product.findById(req.params.id);

  if (!product) {
    console.error("❌ ERROR: Product not found");
    return res.status(404).json({ message: "Product not found" });
  }

  const review = product.reviews.find(
    (r) => r._id.toString() === req.params.reviewId
  );

  if (!review) {
    console.error("❌ ERROR: Review not found inside product");
    return res.status(404).json({ message: "Review not found" });
  }

  review.approved = true; // ✅ Mark review as approved

  try {
    console.log("✅ Before Saving:", product.reviews); // ✅ Debugging before saving

    await product.save(); // ✅ Save changes to database

    console.log("✅ After Saving:", product.reviews); // ✅ Debugging after saving
    res.json({ message: "Review approved" });
  } catch (error) {
    console.error("❌ ERROR Saving Review:", error);
    res.status(500).json({ message: "Error saving approved review" });
  }
});

// @desc Pending Review
// @route get /api/products/pending review
// @access Private
const getPendingReviews = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({ "reviews.approved": false }).select(
      "reviews brandname"
    );

    let pendingReviews = [];
    products.forEach((product) => {
      product.reviews.forEach((review) => {
        if (!review.approved) {
          console.log("✅ Adding Review:", review);
          pendingReviews.push({
            _id: review._id ? review._id.toString() : null, // ✅ Ensure review._id is extracted
            productId: product._id ? product._id.toString() : null, // ✅ Ensure productId is included
            brandname: product.brandname,
            name: review.name,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
          });
        }
      });
    });

    res.json(pendingReviews);
  } catch (error) {
    console.error("❌ Error fetching pending reviews:", error);
    res.status(500).json({ message: "Failed to fetch pending reviews" });
  }
});

export {
  getProducts,
  deleteProduct,
  createProduct,
  updateProduct,
  createproductreview,
  uploadProducts,
  addToCart,
  getCart,
  deleteCartItem,
  getProductById,
  approveReview,
  getPendingReviews,
};
