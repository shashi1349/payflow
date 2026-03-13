import IdempotencyKey from "../models/IdempotencyKey.js";

// Check if key exists → return cached response
export const checkIdempotency = async (key) => {
  const existing = await IdempotencyKey.findOne({ key });
  if (existing) return existing.responseSnapshot;
  return null;
};

// Save key + response after successful payment creation
export const saveIdempotency = async (key, paymentId, responseSnapshot) => {
  await IdempotencyKey.create({ key, paymentId, responseSnapshot });
};