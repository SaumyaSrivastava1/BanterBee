import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/logo2.png"; // <--- IMPORT LOGO

const LoginPage = () => {
  // ... keep existing state and logic ...
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    /* ... keep existing submit logic ... */
    e.preventDefault();
    if (!username || !password) return;
    try {
      setLoading(true);
      const res = await api.post("/api/auth/login", { username, password });
      if (res.data.status === false) throw new Error(res.data.msg);
      login(res.data.user, res.data.token);
      navigate("/chat");
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-bg">
      <div className="auth-card">
        <div className="auth-header">
          {/* REPLACE THE TEXT PILL WITH LOGO */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "25px" }}>
            <img src={logo} alt="BanterBee" className="auth-logo" />
            <span style={{ fontSize: "1.7rem", fontWeight: "800", color: "#4f46e5", letterSpacing: "-0.5px" }}>
              BanterBee
            </span>
          </div>

          <h2>Welcome back 👋</h2>
          <p>Sign in to continue chatting with your friends.</p>
        </div>

        {/* ... keep the rest of the form exactly the same ... */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
        </form>
        <p className="auth-footer">New here? <Link to="/register" className="welcome-link">Create an account</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;