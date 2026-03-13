import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div
        className="text-xl font-bold text-blue-600 cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        💳 PayFlow
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.name}
          <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {user?.role}
          </span>
        </span>
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </nav>
  );
}