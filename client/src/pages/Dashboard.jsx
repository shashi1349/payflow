import { useState, useEffect } from "react";
import { getPaymentsApi } from "../api/paymentApi";
import Navbar from "../components/layout/Navbar";
import PaymentForm from "../components/payments/PaymentForm";
import PaymentCard from "../components/payments/PaymentCard";
import Loader from "../components/common/Loader";

export default function Dashboard() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentsApi()
      .then(({ data }) => setPayments(data.data.payments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePaymentCreated = (newPayment) => {
    setPayments((prev) => [newPayment, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PaymentForm onPaymentCreated={handlePaymentCreated} />
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Recent Payments
        </h2>
        {loading ? (
          <Loader />
        ) : payments.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No payments yet. Send your first payment above.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map((p) => (
              <PaymentCard key={p._id} payment={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}