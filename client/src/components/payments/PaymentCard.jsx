import { useNavigate } from "react-router-dom";
import Badge from "../common/Badge";
import { useAuth } from "../../context/AuthContext";

export default function PaymentCard({ payment }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Handle both populated objects and plain IDs
  const senderId = payment.senderId?._id?.toString() || payment.senderId?.toString();
  const receiverId = payment.receiverId?._id?.toString() || payment.receiverId?.toString();
  const senderName = payment.senderId?.name || "Unknown";
  const receiverName = payment.receiverId?.name || "Unknown";

const isSender = senderId === user?._id?.toString();
  return (
    <div
      onClick={() => navigate(`/payments/${payment._id || payment.paymentId}`)}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">
            {isSender ? "Sent to" : "Received from"}
          </p>
          <p className="font-semibold text-gray-800">
            {isSender ? receiverName : senderName}
          </p>
        </div>
        <Badge status={payment.status} />
      </div>
      <div className="mt-3 flex justify-between items-center">
        <span className={`text-lg font-bold ${isSender ? "text-red-500" : "text-green-500"}`}>
          {isSender ? "-" : "+"}{payment.currency} {payment.amount}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(payment.createdAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}