import { Router } from "express";
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.use(authenticate);

router.post("/", rateLimiter, createPayment);      // rate limit writes only
router.get("/", getPayments);                       // no limit on reads
router.get("/:id", getPaymentById);                // no limit on reads
router.patch("/:id/status", rateLimiter, updatePaymentStatus);

export default router;