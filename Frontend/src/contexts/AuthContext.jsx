import React, { createContext, useContext, useEffect, useState } from "react";
import authUtil from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(authUtil.getAuthToken());
  const [user, setUser] = useState(authUtil.getAuthUser());
  const [poOrder, setPoOrder] = useState("");

  useEffect(() => {
    // keep token in sync if changed externally
    const handleStorage = () => {
      setToken(authUtil.getAuthToken());
      setUser(authUtil.getAuthUser());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (token, user, options = {}, callback) => {
    authUtil.saveAuth(token, user);
    setToken(token);
    setUser(user);
    if (callback) callback();
  };

  const logout = () => {
    authUtil.clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, setPoOrder, poOrder }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
