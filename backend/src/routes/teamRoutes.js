import express from "express";
import { registerTeam, getTeams } from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, registerTeam);
router.get("/", protect, getTeams);

export default router;
