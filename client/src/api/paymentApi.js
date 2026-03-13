import axiosInstance from "./axiosInstance";
import { v4 as uuidv4 } from "uuid";

export const createPaymentApi = (data) =>
  axiosInstance.post("/payments", data, {
    headers: { "Idempotency-Key": uuidv4() },
  });

export const getPaymentsApi = () =>
  axiosInstance.get("/payments");

export const getPaymentByIdApi = (id) =>
  axiosInstance.get(`/payments/${id}`);

export const updatePaymentStatusApi = (id, targetStatus, failureReason) =>
  axiosInstance.patch(`/payments/${id}/status`, { targetStatus, failureReason });