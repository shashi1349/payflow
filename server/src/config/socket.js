import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
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
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // User joins their personal room on dashboard load
    socket.on("join_user_room", (userId) => {
      socket.join(`user:${userId}`);
      console.log(`👤 Socket ${socket.id} joined user room: ${userId}`);
    });

    // User joins a specific payment room on detail page
    socket.on("join_payment_room", (paymentId) => {
      socket.join(paymentId);
      console.log(`📦 Socket ${socket.id} joined room: ${paymentId}`);
    });

    socket.on("leave_payment_room", (paymentId) => {
      socket.leave(paymentId);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};