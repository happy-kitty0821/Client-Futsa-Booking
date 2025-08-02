import express from "express";
import {
  createTournament,
  deleteTournament,
  getMyRegistrations,
  getTeamsForTournament,
  getTournaments,
  getUpcomingTournaments,
  registerTeamForTournament,
  updateTournament,
  generateTieSheet
} from "../controllers/tournamentController.js";
import { protect } from "../middleware/authMiddleware.js";

import multer from "multer";

const router = express.Router();

const upload = multer();

// router.post("/", protect, createTournament);
router.post("/", protect, upload.none(), createTournament);
router.get("/", protect, getTournaments);
router.put("/:id", protect, updateTournament);
router.delete("/:id", protect, deleteTournament);
router.get("/upcoming", getUpcomingTournaments);
router.post("/register-team", protect, registerTeamForTournament);
router.get("/my-registrations", protect, getMyRegistrations);
router.get("/:id/teams", getTeamsForTournament);
router.get("/:id/tie-sheet", generateTieSheet);

export default router;
