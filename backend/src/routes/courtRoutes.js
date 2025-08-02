import express from "express";
import { getCourts, getCourtById, addCourt, updateCourt, deleteCourt } from "../controllers/courtController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/", getCourts);
router.get("/:id", getCourtById);

// Protected admin routes
router.post("/", protect, admin, upload.single('image'), addCourt);
router.put("/:id", protect, admin, upload.single('image'), updateCourt);
router.delete("/:id", protect, admin, deleteCourt);

export default router;
