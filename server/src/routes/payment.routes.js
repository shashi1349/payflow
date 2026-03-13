import { Router } from "express";
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// All payment routes are protected
router.use(authenticate);

router.post("/", createPayment);
router.get("/", getPayments);
router.get("/:id", getPaymentById);
router.patch("/:id/status", updatePaymentStatus);

export default router;