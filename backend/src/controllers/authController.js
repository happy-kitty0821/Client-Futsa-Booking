import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { findUserByEmail, createUser } from "../models/userModel.js";

dotenv.config();

export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const userExists = await findUserByEmail(email);
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await createUser(name, email, phone, hashedPassword);

    res.status(201).json({ message: "User registered successfully", userId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    console.log('login started')
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, '954367d42d3dac71d30442cc02180e2dbccb484de288b9283494e32ba7d26c250668e1e036907e7407e64bddb5b4c59bddcdb3c66c778ec66d0c192afdcf0323', { expiresIn: "1h" });

    res.json({ token, user });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    await pool.query("UPDATE users SET reset_token = ? WHERE email = ?", [token, email]);

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });

    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });

    res.json({ message: "Password reset link sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.query("UPDATE users SET password = ?, reset_token = NULL WHERE reset_token = ?", [hashedPassword, token]);

    if (result.affectedRows === 0) return res.status(400).json({ message: "Invalid token" });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
