import { useState } from "react";
import { createPaymentApi } from "../../api/paymentApi";
import Button from "../common/Button";

export default function PaymentForm({ onPaymentCreated }) {
  const [form, setForm] = useState({ receiverId: "", amount: "", currency: "INR" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!form.receiverId || !form.amount) {
      return setError("Receiver ID and amount are required");
    }
    try {
      setLoading(true);
      const { data } = await createPaymentApi({
        receiverId: form.receiverId,
        amount: Number(form.amount),
        currency: form.currency,
      });
      setForm({ receiverId: "", amount: "", currency: "INR" });
      onPaymentCreated(data.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h2 className="text-base font-semibold text-gray-700 mb-4">
        Send Payment
      </h2>
      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Receiver User ID"
          value={form.receiverId}
          onChange={(e) => setForm({ ...form, receiverId: e.target.value })}
        />
        <div className="flex gap-2">
          <input
            type="number"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          >
            <option>INR</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Sending..." : "Send Payment"}
        </Button>
      </div>
    </div>
  );
}