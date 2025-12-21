import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/logo2.png"; // <--- IMPORT LOGO

const RegisterPage = () => {
  // ... keep existing state and logic ...
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    /* ... keep existing logic ... */
    e.preventDefault();
    if (!username || !password) return;
    try {
      setLoading(true);
      const res = await api.post("/api/auth/register", { username, password });
      if (res.data.status === false) throw new Error(res.data.msg);
      login(res.data.user, res.data.token);
      navigate("/avatar"); // or /chat depending on your preference
    } catch (err) {
      alert(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-bg">
      <div className="auth-card">
        <div className="auth-header">
           {/* LOGO HEADER */}
           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "25px" }}>
            <img src={logo} alt="BanterBee" className="auth-logo" />
            <span style={{ fontSize: "1.7rem", fontWeight: "800", color: "#4f46e5", letterSpacing: "-0.5px" }}>
              BanterBee
            </span>
          </div>

          <h2>Create your account ✨</h2>
          <p>Pick a fun username now. You'll choose your avatar next.</p>
        </div>

        {/* ... keep form ... */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input type="text" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? "Creating..." : "Sign Up"}</button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login" className="welcome-link">Log in</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;