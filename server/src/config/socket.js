import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || origin.startsWith("http://localhost")) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
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