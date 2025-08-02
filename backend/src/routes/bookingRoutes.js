import express from "express";
import { bookCourt, getBookings, cancelBooking, modifyBooking, bookRecurringCourt, getBookingsForCalendar, getAllBookings, updatePaymentStatus } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, bookCourt); // Normal single booking
router.post("/recurring", protect, bookRecurringCourt); // New route for recurring bookings
router.get("/", protect, getBookings); // Get all user bookings
router.put("/:id", protect, modifyBooking); // New route to modify an existing booking
router.delete("/:id", protect, cancelBooking); // Cancel a booking
router.get("/calendar/:year/:month", protect, getBookingsForCalendar);
router.get("/admin", protect, protectAdmin, getAllBookings);
router.patch("/:id/payment", protect, updatePaymentStatus);

export default router;
