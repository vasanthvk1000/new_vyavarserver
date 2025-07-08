import express from "express";
import {
  getBanners,
  addBanner,
  deleteBanner,
  addvideobanner,
  getvideobanner,
  deletevideobanner,
  getUserVideoBanners,
} from "../controlers/bannerController.js";
import { uploadSingleImage, uploadSingleVideo } from "../multer/multer.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Banner Routes
// router.route("/banner").post(protect, admin, addBanner);
router.route("/banner").post(protect, admin, uploadSingleImage, addBanner);
router.route("/banners/:id").delete(protect, admin, deleteBanner);
router.route("/banners").get(getBanners);
router
  .route("/addvideobanner")
  .post(protect, admin, uploadSingleVideo, addvideobanner);
router.route("/getvideobanner").get(getvideobanner);
router
  .route("/deletevideobanner/:productId/:videoId")
  .delete(protect, admin, deletevideobanner);
router.route("/getuservideobanners").get(getUserVideoBanners);

export default router;
