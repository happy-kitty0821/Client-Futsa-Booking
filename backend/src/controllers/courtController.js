import pool from "../config/db.js";
import path from 'path';
import fs from 'fs/promises';

export const getCourts = async (req, res) => {
  try {
    console.info('fetching all the courts in the db')
    const [courts] = await pool.query("SELECT * FROM courts");
    console.log(courts)
    res.json(courts);
  } catch (error) {
    console.error('error fetching all the courts')
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCourtById = async (req, res) => {
  try {
    const [court] = await pool.query("SELECT * FROM courts WHERE id = ?", [req.params.id]);
    if (court.length === 0) return res.status(404).json({ message: "Court not found" });
    res.json(court[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add a new court
export const addCourt = async (req, res) => {
  try {
    console.info("Adding a new futsal court to the database : ")
    const { name, location, price_per_hour, peak_price, off_peak_price, available_slots, contact_number } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    console.info(req.body)
    const [result] = await pool.query(
      "INSERT INTO courts (name, location, price_per_hour, peak_price, off_peak_price, available_slots, image_url, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        location,
        price_per_hour,
        peak_price,
        off_peak_price,
        available_slots,
        image_url,
        contact_number
      ]
    );
    res.status(201).json({ message: "Court added successfully", courtId: result.insertId });
  } catch (error) {
    console.error('error adding court')
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update an existing court
export const updateCourt = async (req, res) => {
  try {
    const { name, location, price_per_hour, peak_price, off_peak_price, available_slots, contact_number } = req.body;
    const { id } = req.params;

    // Get the current court data to preserve the image if no new one is uploaded
    const [currentCourt] = await pool.query("SELECT image_url FROM courts WHERE id = ?", [id]);
    const image_url = req.file ? `/uploads/${req.file.filename}` : (currentCourt[0]?.image_url || null);

    const [result] = await pool.query(
      "UPDATE courts SET name = ?, location = ?, price_per_hour = ?, peak_price = ?, off_peak_price = ?, available_slots = ?, image_url = ?, contact_number = ? WHERE id = ?",
      [
        name,
        location,
        price_per_hour,
        peak_price,
        off_peak_price,
        available_slots,
        image_url,
        contact_number,
        id
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Court not found" });

    // If a new image was uploaded and there was an old image, delete the old one


    res.json({ message: "Court updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a court
export const deleteCourt = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the court to delete its image
    const [court] = await pool.query("SELECT image_url FROM courts WHERE id = ?", [id]);
    if (court.length === 0) return res.status(404).json({ message: "Court not found" });

    // Delete the image file if it exists
    if (court[0].image_url) {
      const imagePath = path.join(__dirname, '..', '..', court[0].image_url);
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }

    // Delete the court from database
    const [result] = await pool.query("DELETE FROM courts WHERE id = ?", [id]);
    res.json({ message: "Court deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
