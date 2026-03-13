import { getIO } from "../config/socket.js";

export const notifyStatusChange = (paymentId, payload) => {
  try {
    const io = getIO();
    // Only emit to clients in this payment's room
    io.to(paymentId.toString()).emit("status_update", payload);
    console.log(`📡 Emitted status_update to room: ${paymentId}`);
  } catch (err) {
    console.error("Socket emit failed:", err.message);
  }
};