import { useState, useEffect } from "react";
import { getPaymentsApi, getPaymentByIdApi } from "../api/paymentApi";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import PaymentForm from "../components/payments/PaymentForm";
import PaymentCard from "../components/payments/PaymentCard";
import Loader from "../components/common/Loader";

export default function Dashboard() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    getPaymentsApi()
      .then(({ data }) => setPayments(data.data.payments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("join_user_room", user._id);

    // Fetch full payment from API so names are always populated
    socket.on("new_payment", async (payment) => {
      try {
        const id = payment._id || payment.paymentId;
        const { data } = await getPaymentByIdApi(id);
        const fullPayment = data.data.payment;

        setPayments((prev) => {
          const exists = prev.find((p) => p._id?.toString() === fullPayment._id?.toString());
          if (exists) return prev;
          return [fullPayment, ...prev];
        });
      } catch (err) {
        console.error("Failed to fetch new payment:", err);
      }
    });

    socket.on("payment_status_changed", ({ paymentId, currentStatus }) => {
      setPayments((prev) =>
        prev.map((p) =>
          p._id?.toString() === paymentId?.toString()
            ? { ...p, status: currentStatus }
            : p
        )
      );
    });

    return () => {
      socket.off("new_payment");
      socket.off("payment_status_changed");
    };
  }, [socket, user]);

  const handlePaymentCreated = async (newPayment) => {
    // Also fetch full payment for sender's dashboard
    try {
      const id = newPayment._id || newPayment.paymentId;
      const { data } = await getPaymentByIdApi(id);
      setPayments((prev) => [data.data.payment, ...prev]);
    } catch {
      setPayments((prev) => [newPayment, ...prev]);
    }
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