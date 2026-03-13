import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

export const generateRefreshToken = () => {
  // Random string — not JWT, stored hashed in DB
  return crypto.randomBytes(64).toString("hex");
};

export const hashToken = async (token) => {
  return bcrypt.hash(token, 10);
};

export const compareToken = async (token, hash) => {
  return bcrypt.compare(token, hash);
};