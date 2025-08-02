import express from "express";
import { getUserActivityReport, getCourtUtilizationReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/user-activity", protect, protectAdmin, getUserActivityReport);
router.get("/court-utilization", protect, protectAdmin, getCourtUtilizationReport);

export default router;
