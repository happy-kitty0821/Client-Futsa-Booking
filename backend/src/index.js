import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from "./routes/authRoutes.js";
import courtRoutes from "./routes/courtRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();
const app = express();
const server = createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Basic security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());

// Serve static files from uploads directory
app.use("/api/uploads", express.static(path.join(__dirname, '../uploads')));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use('/api/payments', paymentRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("new-booking", (data) => {
    io.emit("update-availability", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
