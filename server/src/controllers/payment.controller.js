import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Payment from "../models/Payment.js";
import StatusHistory from "../models/StatusHistory.js";
import User from "../models/User.js";
import { transitionPayment, isTerminalStatus } from "../services/stateMachine.js";
import { checkIdempotency, saveIdempotency } from "../services/idempotency.js";
import { notifyStatusChange } from "../services/notifier.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";

// ─── CREATE PAYMENT ─────────────────────────────────────────
export const createPayment = asyncWrapper(async (req, res) => {
  const { receiverId, amount, currency } = req.body;
  const senderId = req.userId;

  // Validate body
  if (!receiverId || !amount) {
    return res.status(400).json({
      success: false,
      error: "receiverId and amount are required",
    });
  }

  // Get or generate idempotency key from header
  const idempotencyKey = req.headers["idempotency-key"] || uuidv4();

  // Check for duplicate request
  const cached = await checkIdempotency(idempotencyKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      idempotent: true,       // tells client this was a duplicate
      data: cached,
    });
  }

  // Validate receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({
      success: false,
      error: "Receiver not found",
    });
  }

  // Prevent self-payment
  if (senderId === receiverId) {
    return res.status(400).json({
      success: false,
      error: "Cannot send payment to yourself",
    });
  }

  // Use MongoDB session for atomic write
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [payment] = await Payment.create(
      [{
        idempotencyKey,
        senderId,
        receiverId,
        amount,
        currency: currency || "INR",
        status: "initiated",
      }],
      { session }
    );

    // Append first status history entry
    await StatusHistory.create(
      [{
        paymentId: payment._id,
        fromStatus: null,
        toStatus: "initiated",
        triggeredBy: "user",
      }],
      { session }
    );

    await session.commitTransaction();

    const responseData = {
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
    };

    // Cache for idempotency
    await saveIdempotency(idempotencyKey, payment._id, responseData);

    res.status(201).json({
      success: true,
      idempotent: false,
      data: responseData,
    });

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─── GET ALL PAYMENTS ────────────────────────────────────────
export const getPayments = asyncWrapper(async (req, res) => {
  const userId = req.userId;

  const payments = await Payment.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  })
    .sort({ createdAt: -1 })
    .populate("senderId", "name email")
    .populate("receiverId", "name email");

  res.json({ success: true, data: { payments } });
});

// ─── GET SINGLE PAYMENT + HISTORY ───────────────────────────
export const getPaymentById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const payment = await Payment.findById(id)
    .populate("senderId", "name email")
    .populate("receiverId", "name email");

  if (!payment) {
    return res.status(404).json({ success: false, error: "Payment not found" });
  }

  // Only sender or receiver can view
  const isSender = payment.senderId._id.toString() === userId;
  const isReceiver = payment.receiverId._id.toString() === userId;

  if (!isSender && !isReceiver) {
    return res.status(403).json({ success: false, error: "Access denied" });
  }

  const history = await StatusHistory.find({ paymentId: id })
    .sort({ changedAt: 1 });

  res.json({ success: true, data: { payment, history } });
});

// ─── UPDATE PAYMENT STATUS ───────────────────────────────────
export const updatePaymentStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { targetStatus, failureReason } = req.body;

  if (!targetStatus) {
    return res.status(400).json({
      success: false,
      error: "targetStatus is required",
    });
  }

  const payment = await Payment.findById(id);
  if (!payment) {
    return res.status(404).json({ success: false, error: "Payment not found" });
  }

  // Block updates on terminal statuses
  if (isTerminalStatus(payment.status)) {
    return res.status(422).json({
      success: false,
      error: `Payment is already ${payment.status} and cannot be updated`,
    });
  }

  // Validate transition through state machine
  transitionPayment(payment.status, targetStatus);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const previousStatus = payment.status;

    // Optimistic concurrency — only update if version matches
    const updated = await Payment.findOneAndUpdate(
      { _id: id, version: payment.version },
      {
        status: targetStatus,
        $inc: { version: 1 },
        ...(failureReason && { failureReason }),
      },
      { new: true, session }
    );

    if (!updated) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: "Payment was modified by another request. Please retry.",
      });
    }

    await StatusHistory.create(
      [{
        paymentId: id,
        fromStatus: previousStatus,
        toStatus: targetStatus,
        triggeredBy: "user",
      }],
      { session }
    );

    await session.commitTransaction();

    // Real-time push to all clients watching this payment
    notifyStatusChange(id, {
      paymentId: id,
      previousStatus,
      currentStatus: targetStatus,
      transitionedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        paymentId: id,
        previousStatus,
        currentStatus: targetStatus,
        transitionedAt: new Date().toISOString(),
      },
    });

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});