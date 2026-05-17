import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("https://atomquest-t29k.onrender.com/api/login", {
        email,
        password,
      });
      login(res.data);
      navigate(`/${res.data.role}`);
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f3f4f6"
    }}>
      <div style={{
        background: "white", padding: "2rem", borderRadius: "12px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)", width: "100%", maxWidth: "400px"
      }}>
        <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "0.25rem" }}>
          AtomQuest
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "14px" }}>
          Goal Setting & Tracking Portal
        </p>

        {error && (
          <div style={{
            background: "#fef2f2", color: "#dc2626", padding: "10px 14px",
            borderRadius: "8px", marginBottom: "1rem", fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={{
              width: "100%", padding: "10px 12px", marginTop: "4px",
              border: "1px solid #d1d5db", borderRadius: "8px",
              fontSize: "14px", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%", padding: "10px 12px", marginTop: "4px",
              border: "1px solid #d1d5db", borderRadius: "8px",
              fontSize: "14px", outline: "none", boxSizing: "border-box"
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "11px", background: "#2563eb",
            color: "white", border: "none", borderRadius: "8px",
            fontSize: "15px", fontWeight: "500", cursor: "pointer"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div style={{
          marginTop: "1.5rem", padding: "12px", background: "#f9fafb",
          borderRadius: "8px", fontSize: "12px", color: "#6b7280"
        }}>
          <p style={{ fontWeight: "500", marginBottom: "4px" }}>Demo credentials:</p>
          <p>employee@demo.com / password123</p>
          <p>manager@demo.com / password123</p>
          <p>admin@demo.com / password123</p>
        </div>
      </div>
    </div>
  );
}
