import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Payment from "../models/Payment.js";
import StatusHistory from "../models/StatusHistory.js";
import User from "../models/User.js";
import { transitionPayment, isTerminalStatus } from "../services/stateMachine.js";
import { checkIdempotency, saveIdempotency } from "../services/idempotency.js";
import { notifyStatusChange, notifyNewPayment } from "../services/notifier.js";
import { asyncWrapper } from "../utils/asyncWrapper.js";

// ─── CREATE PAYMENT ─────────────────────────────────────────
export const createPayment = asyncWrapper(async (req, res) => {
  const { receiverId, amount, currency } = req.body;
  const senderId = req.userId;

  if (!receiverId || !amount) {
    return res.status(400).json({
      success: false,
      error: "receiverId and amount are required",
    });
  }

  const idempotencyKey = req.headers["idempotency-key"] || uuidv4();

  const cached = await checkIdempotency(idempotencyKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      idempotent: true,
      data: cached,
    });
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({
      success: false,
      error: "Receiver not found",
    });
  }

  if (senderId.toString() === receiverId.toString()) {
    return res.status(400).json({
      success: false,
      error: "Cannot send payment to yourself",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

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
    session.endSession();

    // Populate AFTER session ends
    const populatedPayment = await Payment.findById(payment._id)
      .populate("senderId", "name email")
      .populate("receiverId", "name email");

    const responseData = {
      _id: payment._id,
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
    };

    await saveIdempotency(idempotencyKey, payment._id, responseData);
    notifyNewPayment(populatedPayment);

    res.status(201).json({
      success: true,
      idempotent: false,
      data: responseData,
    });

  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw err;
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

  if (isTerminalStatus(payment.status)) {
    return res.status(422).json({
      success: false,
      error: `Payment is already ${payment.status} and cannot be updated`,
    });
  }

  transitionPayment(payment.status, targetStatus);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const previousStatus = payment.status;

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
      session.endSession();
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
    session.endSession();

    notifyStatusChange(id, {
      paymentId: id,
      previousStatus,
      currentStatus: targetStatus,
      transitionedAt: new Date().toISOString(),
      senderId: updated.senderId.toString(),
      receiverId: updated.receiverId.toString(),
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
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw err;
  }
});