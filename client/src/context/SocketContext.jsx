import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      return;
    }

    // Don't create a new socket if one already exists
    if (socket?.connected) {
      socket.emit("join_user_room", user._id);
      return;
    }

    const s = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    s.on("connect", () => {
      console.log("🔌 Socket connected:", s.id);
      s.emit("join_user_room", user._id);
    });

    s.on("reconnect", () => {
      s.emit("join_user_room", user._id);
    });

    s.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    setSocket(s);

    return () => {
      // Only disconnect on logout, not on navigation
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);