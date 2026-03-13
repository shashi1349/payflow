import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
  responseSnapshot: {
    type: mongoose.Schema.Types.Mixed, // stores full API response
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  },
});

// TTL index — auto purges after 24h, zero cron needed
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


export default mongoose.model("IdempotencyKey", idempotencyKeySchema);