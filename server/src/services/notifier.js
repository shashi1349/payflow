import { getIO } from "../config/socket.js";

export const notifyStatusChange = (paymentId, payload) => {
  try {
    const io = getIO();
    // Notify everyone watching this specific payment
    io.to(paymentId.toString()).emit("status_update", payload);
    // Also update the badge on the dashboard
    io.to(`user:${payload.senderId}`).emit("payment_status_changed", {
      paymentId: paymentId.toString(),
      currentStatus: payload.currentStatus,
    });
    io.to(`user:${payload.receiverId}`).emit("payment_status_changed", {
      paymentId: paymentId.toString(),
      currentStatus: payload.currentStatus,
    });
  } catch (err) {
    console.error("Socket emit failed:", err.message);
  }
};

export const notifyNewPayment = (payment) => {
  try {
    const io = getIO();
    io.to(`user:${payment.receiverId._id}`).emit("new_payment", payment);
    console.log(`📡 Notified receiver: ${payment.receiverId._id}`);
  } catch (err) {
    console.error("Socket emit failed:", err.message);
  }
};