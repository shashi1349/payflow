import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { connectDB } from "./src/config/db.js";
import { initSocket } from "./src/config/socket.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { rateLimiter } from "./src/middleware/rateLimiter.js";
import authRoutes from "./src/routes/auth.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Attach Socket.io BEFORE routes
initSocket(httpServer);

// Connect to MongoDB
connectDB();

// Global Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Health check route — always useful in interviews to mention
app.get("/health", (req, res) => {
  res.json({ success: true, message: "PayFlow server is running 🚀" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);

// Global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 PayFlow server running on http://localhost:${PORT}`);
});