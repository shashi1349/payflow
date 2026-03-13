import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
    },
    deviceInfo: {
      type: String,
      default: "unknown",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-deletes expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1 });

export default mongoose.model("Session", sessionSchema);