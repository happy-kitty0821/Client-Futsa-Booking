import express from "express";
import { updateProfile, changePassword, getUsers, getUserBookings, banUser, createUser, updateUser, deleteUser, getCurrentUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.get("/:id/bookings", protect, getUserBookings); // Track bookings for a user (Admin can view)
router.put("/:id/ban", protect, protectAdmin, banUser); // Ban a user (Admin only)
router.get("/", protect, protectAdmin, getUsers); // View all users (Admin only)
router.post("/", protect, protectAdmin, createUser);
router.put("/:id", protect, protectAdmin, updateUser);
router.delete("/:id", protect, protectAdmin, deleteUser);
router.get("/me", protect, getCurrentUser);

export default router;
