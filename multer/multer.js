import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

// 🔹 Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_SECRETKEY,
});

// 🔹 Define Cloudinary Storage for Images & Videos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "uploads"; // Default folder in Cloudinary
    let resourceType = "auto";
    if (file.mimetype.startsWith("image")) {
      folder = "images";
      resourceType = "image";
    } else if (file.mimetype.startsWith("video")) {
      folder = "videos";
      resourceType = "video";
    } else if (file.mimetype === "application/pdf") {
      folder = "pdfs";
      resourceType = "raw"; // PDFs are treated as raw files
    }

    return {
      folder,
      resource_type: resourceType,
      allowed_formats: ["jpg", "jpeg", "png", "mp4", "avi", "pdf"],
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

// 🔹 Multer Configuration with Cloudinary
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "video/mp4",
      "video/avi",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPG, JPEG, PNG, MP4, AVI and PDF are allowed."
        ),
        false
      );
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

//  Export Upload Functions
export const uploadProfileImage = upload.single("profilePicture");
export const uploadSingleImage = upload.single("image");
export const uploadMultipleImages = upload.array("images", 3);
export const uploadSingleVideo = upload.single("video");
export const uploadProductFiles = upload.fields([
  { name: "images", maxCount: 3 },
  { name: "sizeChart", maxCount: 1 },
]);
