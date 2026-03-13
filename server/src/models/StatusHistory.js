import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    fromStatus: {
      type: String,
      default: null,
    },
    toStatus: {
      type: String,
      required: true,
    },
    triggeredBy: {
      type: String,
      enum: ["user", "system", "webhook"],
      default: "system",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Fetch timeline in order for a payment
statusHistorySchema.index({ paymentId: 1, changedAt: 1 });

export default mongoose.model("StatusHistory", statusHistorySchema);