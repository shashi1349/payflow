import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";
import { connectDB } from "./src/config/db.js";
import { initSocket } from "./src/config/socket.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import authRoutes from "./src/routes/auth.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Attach Socket.io BEFORE routes
initSocket(httpServer);

// Connect to MongoDB
connectDB();

// ─── CORS — manual headers, works on all environments ───────
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://payflow-sandy.vercel.app",
    "http://localhost:5173"
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.some(o => origin.startsWith(o))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Idempotency-Key"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// ─── Global Middleware ───────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());

// ─── Health check ────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ success: true, message: "PayFlow server is running 🚀" });
});

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);

// ─── Global error handler — must be last ─────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 PayFlow server running on http://localhost:${PORT}`);
});