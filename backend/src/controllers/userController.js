import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "../models/userModel.js";

export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    await pool.query("UPDATE users SET name = ?, phone = ? WHERE id = ?", [name, phone, req.user.id]);
    res.json({ message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await findUserByEmail(req.user.email);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect old password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);

    res.json({ message: "Password changed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// View all users
export const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT * FROM users");
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Track bookings for a specific user
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.params.id;
    const [bookings] = await pool.query("SELECT * FROM bookings WHERE user_id = ?", [userId]);
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Ban a user
export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("UPDATE users SET role = 'banned' WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User banned successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)", [name, email, phone, hashedPassword]);
    res.status(201).json({ message: "User created", userId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const [result] = await pool.query("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?", [name, email, phone, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const [user] = await pool.query("SELECT id, name, email, phone FROM users WHERE id = ?", [req.user.id]);
    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to get user" });
  }
};
