
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = "https://atomquest-t29k.onrender.com";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tab, setTab] = useState("overview");
  const [success, setSuccess] = useState("");

  const headers = { Authorization: `Bearer ${user.access_token}` };

  const fetchData = async () => {
    const [u, g] = await Promise.all([
      axios.get(`${API}/api/admin/users`, { headers }),
      axios.get(`${API}/api/admin/goals`, { headers }),
    ]);
    setUsers(u.data);
    setGoals(g.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUnlock = async (goalId) => {
    await axios.post(`${API}/api/admin/goals/${goalId}/unlock`, {}, { headers });
    setSuccess("Goal unlocked!");
    fetchData();
    setTimeout(() => setSuccess(""), 3000);
  };

  const exportCSV = () => {
    const rows = [["Employee", "Goal", "Thrust Area", "Target", "Weightage", "Status", "UoM"]];
    goals.forEach(g => {
      const owner = users.find(u => u.id === g.user_id);
      rows.push([owner?.name || "Unknown", g.title, g.thrust_area, g.target, g.weightage + "%", g.status, g.uom_type]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "atomquest_goals.csv"; a.click();
  };

  const statusColor = (s) => ({
    draft: "#f59e0b", pending: "#3b82f6",
    approved: "#10b981", returned: "#ef4444"
  }[s] || "#6b7280");

  const totalGoals = goals.length;
  const approvedGoals = goals.filter(g => g.status === "approved").length;
  const pendingGoals = goals.filter(g => g.status === "pending").length;
  const employees = users.filter(u => u.role === "employee");
  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <div style={{ background: "white", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <span style={{ fontWeight: "600", fontSize: "18px" }}>AtomQuest</span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "14px", color: "#6b7280" }}>👤 {user.name}</span>
          <button onClick={logout} style={{ fontSize: "13px", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 1rem" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "1.5rem" }}>
          {[["Total Goals", totalGoals, "#2563eb"], ["Approved", approvedGoals, "#10b981"], ["Pending", pendingGoals, "#f59e0b"]].map(([label, val, color]) => (
            <div key={label} style={{ background: "white", borderRadius: "12px", padding: "1.25rem", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize: "28px", fontWeight: "600", color }}>{val}</p>
              <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
          {["overview", "goals"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px",
              background: tab === t ? "#2563eb" : "white", color: tab === t ? "white" : "#374151",
              fontWeight: tab === t ? "500" : "400"
            }}>{t === "overview" ? "Users Overview" : "All Goals"}</button>
          ))}
          <button onClick={exportCSV} style={{ marginLeft: "auto", padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", background: "#10b981", color: "white", fontWeight: "500" }}>
            ⬇ Export CSV
          </button>
        </div>

        {success && <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontSize: "14px" }}>{success}</div>}

        {/* Users Overview Tab */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {employees.map(emp => {
              const empGoals = goals.filter(g => g.user_id === emp.id);
              const approved = empGoals.filter(g => g.status === "approved").length;
              const pending = empGoals.filter(g => g.status === "pending").length;
              return (
                <div key={emp.id} style={{ background: "white", borderRadius: "12px", padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div>
                    <p style={{ fontWeight: "500", fontSize: "15px" }}>{emp.name}</p>
                    <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>{emp.email}</p>
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
                    <span style={{ color: "#10b981" }}>✅ {approved} approved</span>
                    <span style={{ color: "#f59e0b" }}>🟡 {pending} pending</span>
                    <span style={{ color: "#6b7280" }}>📋 {empGoals.length} total</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All Goals Tab */}
        {tab === "goals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {goals.map(goal => {
              const owner = users.find(u => u.id === goal.user_id);
              return (
                <div key={goal.id} style={{ background: "white", borderRadius: "12px", padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "500", fontSize: "15px" }}>{goal.title}</span>
                      <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "20px", background: statusColor(goal.status) + "20", color: statusColor(goal.status), fontWeight: "500" }}>{goal.status}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#6b7280" }}>{owner?.name} · {goal.thrust_area} · {goal.weightage}% · Target: {goal.target}</p>
                  </div>
                  {goal.status === "approved" && (
                    <button onClick={() => handleUnlock(goal.id)} style={{ padding: "7px 14px", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Unlock</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}