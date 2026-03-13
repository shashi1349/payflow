import User from "../models/User.js";
import Session from "../models/Session.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  compareToken,
} from "../utils/generateTokens.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";

// ─── REGISTER ───────────────────────────────────────────────
export const register = asyncWrapper(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "Name, email and password are required",
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: "Email already registered",
    });
  }

  const user = await User.create({
    name,
    email,
    passwordHash: password, // pre-save hook hashes this
    role: role || "payer",
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = await hashToken(refreshToken);

  await Session.create({
    userId: user._id,
    refreshTokenHash,
    deviceInfo: req.headers["user-agent"] || "unknown",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken, // client stores this securely
    },
  });
});

// ─── LOGIN ──────────────────────────────────────────────────
export const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Invalid email or password",
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: "Invalid email or password",
    });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = await hashToken(refreshToken);

  await Session.create({
    userId: user._id,
    refreshTokenHash,
    deviceInfo: req.headers["user-agent"] || "unknown",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.json({
    success: true,
    data: { user, accessToken, refreshToken },
  });
});

// ─── REFRESH TOKEN ──────────────────────────────────────────
export const refresh = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: "Refresh token required",
    });
  }

  // Find all sessions and compare hashed tokens
  const sessions = await Session.find({
    expiresAt: { $gt: new Date() },
  });

  let validSession = null;
  for (const session of sessions) {
    const isMatch = await compareToken(refreshToken, session.refreshTokenHash);
    if (isMatch) {
      validSession = session;
      break;
    }
  }

  if (!validSession) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired refresh token",
    });
  }

  // Rotate — delete old session, create new one
  await Session.findByIdAndDelete(validSession._id);

  const newAccessToken = generateAccessToken(validSession.userId);
  const newRefreshToken = generateRefreshToken();
  const newRefreshTokenHash = await hashToken(newRefreshToken);

  await Session.create({
    userId: validSession.userId,
    refreshTokenHash: newRefreshTokenHash,
    deviceInfo: req.headers["user-agent"] || "unknown",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});

// ─── LOGOUT ─────────────────────────────────────────────────
export const logout = asyncWrapper(async (req, res) => {
  // Delete all sessions for this user (logs out all devices)
  await Session.deleteMany({ userId: req.userId });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// ─── GET CURRENT USER ───────────────────────────────────────
export const getMe = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }
  res.json({ success: true, data: { user } });
});

export const searchUsers = asyncWrapper(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json({ success: true, data: { users: [] } });
  }

  const users = await User.find({
    _id: { $ne: req.userId }, // exclude yourself
    $or: [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ],
  }).select("name email role").limit(5);

  res.json({ success: true, data: { users } });
});