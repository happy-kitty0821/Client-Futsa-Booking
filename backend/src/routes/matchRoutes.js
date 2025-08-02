import express from "express";
import { generateFixtures, getMatches, updateMatchScore, getLeaderboard, generateKnockoutStage } from "../controllers/matchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", protect, generateFixtures);
router.get("/:tournament_id", protect, getMatches);
router.put("/update-score/:match_id", protect, updateMatchScore);
router.get("/leaderboard/:tournament_id", protect, getLeaderboard);
router.post("/generate-knockout", protect, generateKnockoutStage); // New Route for Knockout Stage

export default router;
