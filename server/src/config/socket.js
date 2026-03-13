import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5176"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client joins a room specific to a payment
    socket.on("join_payment_room", (paymentId) => {
      socket.join(paymentId);
      console.log(`📦 Socket ${socket.id} joined room: ${paymentId}`);
    });

    // Client leaves room when navigating away
    socket.on("leave_payment_room", (paymentId) => {
      socket.leave(paymentId);
      console.log(`📤 Socket ${socket.id} left room: ${paymentId}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Call this from anywhere in the server to get the io instance
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};