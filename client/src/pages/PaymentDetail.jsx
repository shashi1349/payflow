import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPaymentByIdApi, updatePaymentStatusApi } from "../api/paymentApi";
import { useSocket } from "../context/SocketContext";
import Navbar from "../components/layout/Navbar";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import StatusTimeline from "../components/payments/StatusTimeline";
import Loader from "../components/common/Loader";

export default function PaymentDetail() {
  const { id } = useParams();
  const { socket } = useSocket();
  const [payment, setPayment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getPaymentByIdApi(id)
      .then(({ data }) => {
        setPayment(data.data.payment);
        setHistory(data.data.history);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Join socket room + listen for live updates
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("join_payment_room", id);

    socket.on("status_update", (payload) => {
      setPayment((prev) => ({ ...prev, status: payload.currentStatus }));
      setHistory((prev) => [
        ...prev,
        {
          _id: Date.now(),
          fromStatus: payload.previousStatus,
          toStatus: payload.currentStatus,
          triggeredBy: "system",
          changedAt: payload.transitionedAt,
        },
      ]);
    });

    return () => {
      socket.emit("leave_payment_room", id);
      socket.off("status_update"); // removes only this specific listener
    };
  }, [socket, id]);

  const handleStatusUpdate = async (targetStatus) => {
    try {
      setUpdating(true);
      await updatePaymentStatusApi(id, targetStatus);
    } catch (err) {
      alert(err.response?.data?.error || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <><Navbar /><Loader /></>;
  if (!payment) return <><Navbar /><p className="text-center mt-10 text-gray-500">Payment not found</p></>;

  const isTerminal = ["settled", "failed"].includes(payment.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Payment ID</p>
              <p className="text-xs font-mono text-gray-600">{payment._id}</p>
            </div>
            <Badge status={payment.status} />
          </div>

          {/* Amount */}
          <div className="text-center py-6 border-y border-gray-100 mb-6">
            <p className="text-4xl font-bold text-gray-800">
              {payment.currency} {payment.amount}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {new Date(payment.createdAt).toLocaleString("en-IN")}
            </p>
          </div>

          {/* Parties */}
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-xs text-gray-400">From</p>
              <p className="font-medium text-gray-700">{payment.senderId?.name}</p>
              <p className="text-xs text-gray-400">{payment.senderId?.email}</p>
            </div>
            <div className="text-2xl">→</div>
            <div className="text-right">
              <p className="text-xs text-gray-400">To</p>
              <p className="font-medium text-gray-700">{payment.receiverId?.name}</p>
              <p className="text-xs text-gray-400">{payment.receiverId?.email}</p>
            </div>
          </div>

          {/* Action buttons — hidden for terminal statuses */}
          {!isTerminal && (
            <div className="flex gap-2 mb-6">
              {payment.status === "initiated" && (
                <Button
                  onClick={() => handleStatusUpdate("processing")}
                  disabled={updating}
                  className="flex-1"
                >
                  Mark Processing
                </Button>
              )}
              {payment.status === "processing" && (
                <>
                  <Button
                    variant="success"
                    onClick={() => handleStatusUpdate("settled")}
                    disabled={updating}
                    className="flex-1"
                  >
                    Mark Settled
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleStatusUpdate("failed")}
                    disabled={updating}
                    className="flex-1"
                  >
                    Mark Failed
                  </Button>
                </>
              )}
            </div>
          )}

          <StatusTimeline history={history} />
        </div>
      </div>
    </div>
  );
}