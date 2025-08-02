import pool from "../config/db.js";

// export const getUserActivityReport = async (req, res) => {
//   try {
//     const [results] = await pool.query(`
//       SELECT HOUR(start_time) AS hour, HOUR(end_time) AS hour2, COUNT(*) AS count 
//       FROM bookings 
//       WHERE status = 'confirmed'
//       GROUP BY HOUR(start_time)
//       ORDER BY hour ASC
//     `);
//     results.forEach((e) => (e.index = `${e.hour <= 9 ? "0" + e.hour : e.hour}:00-${e.hour2 <= 9 ? "0" + e.hour2 : e.hour2}:00`));
//     console.log(results);

//     res.json(results);
//   } catch (error) {
//     console.error("Error fetching user activity report:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const getUserActivityReport = async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        HOUR(start_time) AS hour, 
        COUNT(*) AS count 
      FROM bookings 
      WHERE status = 'confirmed'
      GROUP BY HOUR(start_time)
      ORDER BY hour ASC
    `);

    // Example: Assume each slot is 1 hour → build the range string
    results.forEach((e) => {
      const endHour = (e.hour + 1) % 24;
      e.index = `${e.hour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`;
    });

    console.log(results);
    res.json(results);
  } catch (error) {
    console.error("Error fetching user activity report:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCourtUtilizationReport = async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT c.name AS court, COUNT(b.id) AS count 
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE b.status = 'confirmed'
      GROUP BY c.id
      ORDER BY count DESC
    `);
    res.json(results);
  } catch (error) {
    console.error("Error fetching court utilization report:", error);
    res.status(500).json({ message: "Server error" });
  }
};
