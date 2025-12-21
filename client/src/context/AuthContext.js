import React, { createContext, useState } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // FIX 1: Read 'user' from localStorage IMMEDIATELY (Lazy Init)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("chatUser");
      if (saved) {
        return JSON.parse(saved).user;
      }
      return null;
    } catch (error) {
      return null;
    }
  });

  // FIX 2: Read 'token' from localStorage IMMEDIATELY
  const [token, setToken] = useState(() => {
    try {
      const saved = localStorage.getItem("chatUser");
      if (saved) {
        return JSON.parse(saved).token;
      }
      return null;
    } catch (error) {
      return null;
    }
  });

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem("chatUser", JSON.stringify({ user: userData, token: jwt }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("chatUser");
    localStorage.removeItem("token"); // Clean up legacy keys if any
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};