import pool from "../config/db.js";
import { sendBookingConfirmation, sendCancellationEmail, sendSlotOpeningEmail } from "../config/mail.js";

export const bookCourt = async (req, res) => {
  try {
    const { court_id, date, start_time, end_time } = req.body;
    console.log(req.body);

    const user_id = req.user.id;

    // const bookingDate = new Date(date);
    // const today = new Date();

    // // Prevent bookings in the past
    // if (bookingDate < today) {
    //   return res.status(400).json({ message: "Cannot book past dates" });
    // }

    const bookingStartDateTime = new Date(`${date}T${start_time}`);
    if (bookingStartDateTime < new Date()) {
      return res.status(400).json({ message: "Cannot book in the past" });
    }
    // Check for overlapping bookings
    const [existing] = await pool.query(
      `SELECT * FROM bookings 
       WHERE court_id = ? AND date = ? 
       AND ((start_time < ? AND end_time > ?) 
       OR (start_time < ? AND end_time > ?))`,
      [court_id, date, end_time, start_time, start_time, end_time]
    );

    if (existing.length > 0) {
      // Find next available slot
      const [availableSlot] = await pool.query("SELECT end_time FROM bookings WHERE court_id = ? AND date = ? ORDER BY end_time DESC LIMIT 1", [court_id, date]);

      if (availableSlot.length > 0) {
        const nextAvailableStart = new Date(`1970-01-01T${availableSlot[0].end_time}`);
        const bufferMinutes = 30; // Configurable buffer
        nextAvailableStart.setMinutes(nextAvailableStart.getMinutes() + bufferMinutes);

        const durationMinutes = (new Date(`1970-01-01T${end_time}`) - new Date(`1970-01-01T${start_time}`)) / (1000 * 60);
        const nextAvailableEnd = new Date(nextAvailableStart);
        nextAvailableEnd.setMinutes(nextAvailableEnd.getMinutes() + durationMinutes);

        return res.status(400).json({
          message: "Slot not available, next available slot suggested",
          suggested_start: nextAvailableStart.toTimeString().slice(0, 5),
          suggested_end: nextAvailableEnd.toTimeString().slice(0, 5),
        });
      }

      return res.status(400).json({ message: "No available slots today" });
    }

    const [result] = await pool.query("INSERT INTO bookings (user_id, court_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, 'confirmed')", [
      user_id,
      court_id,
      date,
      start_time,
      end_time,
    ]);

    const [user] = await pool.query("SELECT email FROM users WHERE id = ?", [user_id]);
    const [court] = await pool.query("SELECT name FROM courts WHERE id = ?", [court_id]);

    await sendBookingConfirmation(user[0].email, {
      court: court[0].name,
      date,
      start_time,
      end_time,
    });

    const bookingId = result.insertId;

    res.status(201).json({ message: "Booking successful", bookingId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// export const getBookings = async (req, res) => {
//   try {
//     const [bookings] = await pool.query(
//       `SELECT 
//          b.*, 
//          c.name AS court 
//        FROM bookings b
//        JOIN courts c ON b.court_id = c.id
//        WHERE b.user_id = ?`,
//       [req.user.id]
//     );

//     res.json(bookings);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
export const getBookings = async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT 
         b.*, 
         c.name AS court,
         c.price_per_hour,
         c.peak_price,
         c.off_peak_price
       FROM bookings b
       JOIN courts c ON b.court_id = c.id
       WHERE b.user_id = ?`,
      [req.user.id]
    );

    // Calculate amount for each booking
    const bookingsWithAmount = bookings.map(booking => {
      // Calculate duration in hours
      const startTime = new Date(`1970-01-01T${booking.start_time}`);
      const endTime = new Date(`1970-01-01T${booking.end_time}`);
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      
      // Determine if it's peak time (example: 5PM-10PM)
      const isPeakTime = 
        booking.start_time >= '17:00:00' && 
        booking.start_time < '22:00:00';
      
      // Use appropriate price
      const hourlyRate = isPeakTime ? 
        (booking.peak_price || booking.price_per_hour) : 
        (booking.off_peak_price || booking.price_per_hour);
      
      // Calculate total amount
      const amount = durationHours * hourlyRate;

      return {
        ...booking,
        amount: parseFloat(amount.toFixed(2)) // Round to 2 decimal places
      };
    });

    res.json(bookingsWithAmount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    // Retrieve booking details
    const [booking] = await pool.query("SELECT user_id, court_id, date, start_time, status FROM bookings WHERE id = ?", [bookingId]);

    if (!booking.length) return res.status(404).json({ message: "Booking not found" });

    // Check if the user is the owner of the booking
    if (booking[0].user_id !== userId) {
      return res.status(403).json({ message: "You are not authorized to cancel this booking" });
    }

    // Check if the booking is already canceled
    if (booking[0].status === "cancelled") {
      return res.status(400).json({ message: "This booking has already been cancelled" });
    }

    // Ensure cancellations are made 24+ hours before the booking date
    const bookingDate = new Date(booking[0].date);
    const today = new Date();
    if (bookingDate - today < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: "Cancellations must be made at least 24 hours in advance" });
    }

    // Update booking status to "cancelled"
    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [bookingId]);

    // Get user's email for cancellation confirmation
    const [user] = await pool.query("SELECT email FROM users WHERE id = ?", [userId]);
    await sendCancellationEmail(user[0].email, booking[0]);

    // Notify other users that a slot has opened
    const [users] = await pool.query("SELECT email FROM users WHERE id != ?", [userId]);
    for (let user of users) {
      await sendSlotOpeningEmail(user.email, booking[0]);
    }

    res.json({ message: "Booking cancelled successfully, notification emails sent!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const modifyBooking = async (req, res) => {
  try {
    const { date, start_time, end_time } = req.body;
    const bookingId = req.params.id;
    const user_id = req.user.id;

    // Check if booking exists
    const [booking] = await pool.query("SELECT * FROM bookings WHERE id = ? AND user_id = ?", [bookingId, user_id]);
    if (booking.length === 0) return res.status(404).json({ message: "Booking not found" });

    // Check if the new time slot is available
    const [conflict] = await pool.query(
      "SELECT * FROM bookings WHERE court_id = ? AND date = ? AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?)) AND id != ?",
      [booking[0].court_id, date, end_time, start_time, start_time, end_time, bookingId]
    );

    if (conflict.length > 0) return res.status(400).json({ message: "New time slot is already booked" });

    await pool.query("UPDATE bookings SET date = ?, start_time = ?, end_time = ? WHERE id = ?", [date, start_time, end_time, bookingId]);

    const [user] = await pool.query("SELECT email FROM users WHERE id = ?", [user_id]);
    const [court] = await pool.query("SELECT name FROM courts WHERE id = ?", [booking[0].court_id]);

    await sendBookingConfirmation(user[0].email, {
      court: court[0].name,
      date,
      start_time,
      end_time,
    });

    res.json({ message: "Booking updated and confirmation sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
export const bookRecurringCourt = async (req, res) => {
  try {
    const { court_id, start_date, start_time, end_time, recurrence } = req.body;
    const user_id = req.user.id;

    let dates = [];
    let currentDate = new Date(start_date);
    for (let i = 0; i < 4; i++) {
      dates.push(new Date(currentDate).toISOString().split("T")[0]);
      if (recurrence === "weekly") currentDate.setDate(currentDate.getDate() + 7);
      else if (recurrence === "monthly") currentDate.setMonth(currentDate.getMonth() + 1);
    }
    for (let date of dates) {
      await pool.query("INSERT INTO bookings (user_id, court_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, 'confirmed')", [
        user_id,
        court_id,
        date,
        start_time,
        end_time,
      ]);
    }

    const [user] = await pool.query("SELECT email FROM users WHERE id = ?", [user_id]);
    const [court] = await pool.query("SELECT name FROM courts WHERE id = ?", [court_id]);

    await sendBookingConfirmation(user[0].email, {
      court: court[0].name,
      date: `${start_date} + ${dates.length - 1} more`, // basic range display
      start_time,
      end_time,
    });

    res.status(201).json({ message: "Recurring bookings created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBookingsForCalendar = async (req, res) => {
  try {
    const { year, month } = req.params;

    const [bookings] = await pool.query("SELECT id, court_id, date, start_time, end_time, status FROM bookings WHERE YEAR(date) = ? AND MONTH(date) = ?", [year, month]);

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.id, u.name AS user, c.name AS court, b.date, b.start_time, b.end_time, b.status 
       FROM bookings b 
       JOIN users u ON b.user_id = u.id
       JOIN courts c ON b.court_id = c.id
       ORDER BY b.date DESC`
    );

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePaymentStatus = async (req, res) => {
  const { id } = req.params; // booking ID
  const userId = req.user.id;
  console.log("updating the payment status for : ", id)

  try {
    // Confirm booking belongs to the user
    const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (rows[0].user_id !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update payment status
    await pool.query("UPDATE bookings SET payment_status = 'paid' WHERE id = ?", [id]);
    res.status(200).json({ message: "Payment status updated" });
  } catch (error) {
    console.error("Payment update failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};
