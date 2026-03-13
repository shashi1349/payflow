import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be at least 1"],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["initiated", "processing", "settled", "failed"],
      default: "initiated",
    },
    failureReason: {
      type: String,
      default: null,
    },
    version: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes — each one has a reason
paymentSchema.index({ senderId: 1, createdAt: -1 });   // dashboard query
paymentSchema.index({ receiverId: 1, createdAt: -1 }); // merchant view
paymentSchema.index({ status: 1, updatedAt: -1 });     // filter by status


export default mongoose.model("Payment", paymentSchema);