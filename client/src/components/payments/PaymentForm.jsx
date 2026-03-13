import { useState, useEffect, useRef } from "react";
import { createPaymentApi } from "../../api/paymentApi";
import { searchUsersApi } from "../../api/authApi";
import Button from "../common/Button";

export default function PaymentForm({ onPaymentCreated }) {
  const [form, setForm] = useState({ amount: "", currency: "INR" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  // Debounced search — waits 300ms after typing stops
  useEffect(() => {
    if (!query || selectedUser) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await searchUsersApi(query);
        setResults(data.data.users);
      } catch {
        setResults([]);
      }
    }, 300);
  }, [query]);

  const handleSelect = (user) => {
    setSelectedUser(user);
    setQuery(user.name);
    setResults([]);
  };

  const handleClear = () => {
    setSelectedUser(null);
    setQuery("");
    setResults([]);
  };

  const handleSubmit = async () => {
    setError("");
    if (!selectedUser) return setError("Please select a recipient");
    if (!form.amount) return setError("Amount is required");

    try {
      setLoading(true);
      const { data } = await createPaymentApi({
        receiverId: selectedUser._id,
        amount: Number(form.amount),
        currency: form.currency,
      });
      setForm({ amount: "", currency: "INR" });
      handleClear();
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

        {/* Recipient search */}
        <div className="relative">
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search recipient by name or email..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedUser) handleClear();
            }}
          />

          {/* Selected user chip */}
          {selectedUser && (
            <div className="absolute right-2 top-1.5 flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
              <span className="text-xs text-blue-700 font-medium">
                {selectedUser.name}
              </span>
              <button
                onClick={handleClear}
                className="text-blue-400 hover:text-blue-600 text-xs ml-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Dropdown results */}
          {results.length > 0 && !selectedUser && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {results.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleSelect(user)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && results.length === 0 && !selectedUser && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3">
              <p className="text-sm text-gray-400">No users found</p>
            </div>
          )}
        </div>

        {/* Amount + currency */}
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

        <Button onClick={handleSubmit} disabled={loading || !selectedUser}>
          {loading ? "Sending..." : "Send Payment"}
        </Button>
      </div>
    </div>
  );
}