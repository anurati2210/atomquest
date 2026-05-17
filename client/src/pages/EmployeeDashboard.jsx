import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = "https://atomquest-t29k.onrender.com";

const THRUST_AREAS = ["Quality", "Delivery", "Cost", "Safety", "People", "Innovation"];
const UOM_TYPES = ["min", "max", "timeline", "zero"];

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [quarterlyData, setQuarterlyData] = useState({});
const [showQuarterly, setShowQuarterly] = useState(null);
const [qForm, setQForm] = useState({ quarter: "Q1", actual_achievement: "", status: "on_track" });
  const [form, setForm] = useState({
    thrust_area: THRUST_AREAS[0], title: "", description: "",
    uom_type: "max", target: "", weightage: ""
  });

  const headers = { Authorization: `Bearer ${user.access_token}` };

  const fetchGoals = async () => {
    const res = await axios.get(`${API}/api/goals`, { headers });
    setGoals(res.data);
  };
  const fetchQuarterly = async (goalId) => {
    const res = await axios.get(`${API}/api/goals/${goalId}/quarterly`, { headers });
    setQuarterlyData(prev => ({ ...prev, [goalId]: res.data }));
  };

const handleQuarterlySubmit = async (goalId) => {
    await axios.post(`${API}/api/goals/${goalId}/quarterly`, {
      ...qForm,
      actual_achievement: parseFloat(qForm.actual_achievement)
    }, { headers });
    fetchQuarterly(goalId);
    setShowQuarterly(null);
    setSuccess("Progress logged successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

const calcScore = (goal, actual) => {
    if (!actual) return "N/A";
    const t = goal.target;
    if (goal.uom_type === "max") return Math.min((actual / t) * 100, 100).toFixed(1) + "%";
    if (goal.uom_type === "min") return Math.min((t / actual) * 100, 100).toFixed(1) + "%";
    if (goal.uom_type === "zero") return actual === 0 ? "100%" : "0%";
    return "N/A";
  };

  useEffect(() => { fetchGoals(); }, []);

  const totalWeightage = goals.filter(g => g.status === "draft" || g.status === "returned").reduce((sum, g) => sum + g.weightage, 0);
  const draftGoals = goals.filter(g => g.status === "draft");
  const canSubmit = draftGoals.length > 0 && Math.abs(totalWeightage - 100) < 0.01 && draftGoals.every(g => g.weightage >= 10);

  const handleAdd = async () => {
    setError("");
    if (!form.title || !form.target || !form.weightage) {
      setError("Please fill all fields."); return;
    }
    if (parseFloat(form.weightage) < 10) {
      setError("Minimum weightage is 10%."); return;
    }
    if (goals.length >= 8) {
      setError("Maximum 8 goals allowed."); return;
    }
    try {
      await axios.post(`${API}/api/goals`, {
        ...form, target: parseFloat(form.target),
        weightage: parseFloat(form.weightage)
      }, { headers });
      setForm({ thrust_area: THRUST_AREAS[0], title: "", description: "", uom_type: "max", target: "", weightage: "" });
      setShowForm(false);
      fetchGoals();
    } catch (e) {
      setError(e.response?.data?.detail || "Error adding goal.");
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/api/goals/${id}`, { headers });
    fetchGoals();
  };

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    try {
      await axios.post(`${API}/api/goals/submit`, {}, { headers });
      setSuccess("Goals submitted for manager approval!");
      fetchGoals();
    } catch (e) {
      setError(e.response?.data?.detail || "Error submitting goals.");
    }
  };

  const statusColor = (s) => ({
    draft: "#f59e0b", pending: "#3b82f6", approved: "#10b981", returned: "#ef4444"
  }[s] || "#6b7280");

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #e8f0fe 0%, #f0f4ff 50%, #e8f0fe 100%)" }}>
      {/* Navbar */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2e75b6 100%)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(30,58,95,0.3)" }}>
        <span style={{ fontWeight: "700", fontSize: "20px", color: "white", letterSpacing: "0.5px" }}>⚡ AtomQuest</span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>👤 {user.name}</span>
          <button onClick={logout} style={{ fontSize: "13px", color: "white", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "6px", padding: "5px 12px", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1e3a5f" }}>My Goals</h2>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>Total weightage: <strong style={{ color: Math.abs(totalWeightage - 100) < 0.01 ? "#10b981" : "#f59e0b" }}>{totalWeightage}%</strong> / 100%</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {draftGoals.length > 0 && (
              <button onClick={handleSubmit} disabled={!canSubmit} style={{
                padding: "9px 18px", background: canSubmit ? "#10b981" : "#d1d5db",
                color: "white", border: "none", borderRadius: "8px", cursor: canSubmit ? "pointer" : "not-allowed", fontSize: "14px"
              }}>Submit for Approval</button>
            )}
            {goals.length < 8 && (
              <button onClick={() => setShowForm(!showForm)} style={{
                padding: "9px 18px", background: "#2563eb", color: "white",
                border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px"
              }}>+ Add Goal</button>
            )}
          </div>
        </div>

        {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontSize: "14px" }}>{error}</div>}
        {success && <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontSize: "14px" }}>{success}</div>}

        {/* Add Goal Form */}
        {showForm && (
          background: "white", borderRadius: "14px", padding: "1.25rem 1.5rem", boxShadow: "0 4px 16px rgba(30,58,95,0.08)", border: "1px solid rgba(30,58,95,0.06)"
            <h3 style={{ marginBottom: "1rem", fontSize: "16px", fontWeight: "600" }}>New Goal</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280" }}>Thrust Area</label>
                <select value={form.thrust_area} onChange={e => setForm({ ...form, thrust_area: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", marginTop: "4px" }}>
                  {THRUST_AREAS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280" }}>UoM Type</label>
                <select value={form.uom_type} onChange={e => setForm({ ...form, uom_type: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", marginTop: "4px" }}>
                  {UOM_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "12px", color: "#6b7280" }}>Goal Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Reduce defect rate"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "12px", color: "#6b7280" }}>Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280" }}>Target Value</label>
                <input type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}
                  placeholder="e.g. 95"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280" }}>Weightage (%)</label>
                <input type="number" value={form.weightage} onChange={e => setForm({ ...form, weightage: e.target.value })}
                  placeholder="e.g. 20"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", marginTop: "4px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
              <button onClick={handleAdd} style={{ padding: "8px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>Add Goal</button>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 20px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <div style={{ background: "white", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
            No goals yet. Click "+ Add Goal" to get started.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {goals.map(goal => (
              <div key={goal.id} style={{ background: "white", borderRadius: "12px", padding: "1.25rem 1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "600", fontSize: "15px" }}>{goal.title}</span>
                    <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "20px", background: statusColor(goal.status) + "20", color: statusColor(goal.status), fontWeight: "500" }}>{goal.status}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    {goal.thrust_area} · Target: {goal.target} · Weightage: {goal.weightage}% · UoM: {goal.uom_type}
                  </div>
                </div>
                {goal.status === "draft" && (
                  <button onClick={() => handleDelete(goal.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                )}
                {goal.status === "approved" && (
  <div style={{ marginTop: "1rem", borderTop: "1px solid #f3f4f6", paddingTop: "1rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
      <span style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>Quarterly Progress</span>
      <button onClick={() => { setShowQuarterly(goal.id); fetchQuarterly(goal.id); }}
        style={{ fontSize: "12px", padding: "4px 12px", background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", cursor: "pointer" }}>
        + Log Progress
      </button>
    </div>

    {(quarterlyData[goal.id] || []).map(q => (
      <div key={q.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", padding: "4px 0" }}>
        <span>{q.quarter}</span>
        <span>Actual: {q.actual_achievement}</span>
        <span>Score: {calcScore(goal, q.actual_achievement)}</span>
        <span style={{ color: q.status === "completed" ? "#10b981" : q.status === "on_track" ? "#3b82f6" : "#6b7280" }}>{q.status}</span>
      </div>
    ))}

    {showQuarterly === goal.id && (
      <div style={{ marginTop: "10px", background: "#f9fafb", borderRadius: "8px", padding: "12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
          <div>
            <label style={{ fontSize: "11px", color: "#6b7280" }}>Quarter</label>
            <select value={qForm.quarter} onChange={e => setQForm({ ...qForm, quarter: e.target.value })}
              style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", marginTop: "2px" }}>
              {["Q1","Q2","Q3","Q4"].map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", color: "#6b7280" }}>Actual Achievement</label>
            <input type="number" value={qForm.actual_achievement}
              onChange={e => setQForm({ ...qForm, actual_achievement: e.target.value })}
              style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", marginTop: "2px", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", color: "#6b7280" }}>Status</label>
            <select value={qForm.status} onChange={e => setQForm({ ...qForm, status: e.target.value })}
              style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", marginTop: "2px" }}>
              <option value="not_started">Not Started</option>
              <option value="on_track">On Track</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => handleQuarterlySubmit(goal.id)}
            style={{ padding: "6px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
            Save
          </button>
          <button onClick={() => setShowQuarterly(null)}
            style={{ padding: "6px 16px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
            Cancel
          </button>
        </div>
      </div>
    )}
  </div>
)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
