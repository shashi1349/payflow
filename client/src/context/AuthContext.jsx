import { createContext, useContext, useState, useEffect } from "react";
import { getMeApi, loginApi, registerApi, logoutApi } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      getMeApi()
        .then(({ data }) => setUser(data.data.user))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await loginApi({ email, password });
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    setUser(data.data.user);
  };

  const register = async (name, email, password, role) => {
    const { data } = await registerApi({ name, email, password, role });
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    setUser(data.data.user);
  };

  const logout = async () => {
    await logoutApi();
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);