import { useNavigate } from "react-router-dom";
import Badge from "../common/Badge";
import { useAuth } from "../../context/AuthContext";

export default function PaymentCard({ payment }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSender = payment.senderId?._id === user?._id ||
                   payment.senderId === user?._id;

  return (
    <div
      onClick={() => navigate(`/payments/${payment._id}`)}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">
            {isSender ? "Sent to" : "Received from"}
          </p>
          <p className="font-semibold text-gray-800">
            {isSender
              ? payment.receiverId?.name || "Unknown"
              : payment.senderId?.name || "Unknown"}
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