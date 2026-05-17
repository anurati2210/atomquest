import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [team, setTeam] = useState([]);
  const [selected, setSelected] = useState(null);
  const [goals, setGoals] = useState([]);
  const [comment, setComment] = useState("");
  const [checkinGoalId, setCheckinGoalId] = useState(null);
  const [checkinComment, setCheckinComment] = useState("");
  const [success, setSuccess] = useState("");

  const headers = { Authorization: `Bearer ${user.access_token}` };

  const fetchTeam = async () => {
    const res = await axios.get(`${API}/api/manager/team`, { headers });
    setTeam(res.data);
  };

  const fetchEmployeeGoals = async (employeeId) => {
    const res = await axios.get(`${API}/api/manager/employee/${employeeId}/goals`, { headers });
    setGoals(res.data);
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleSelectEmployee = (member) => {
    setSelected(member);
    setGoals([]);
    fetchEmployeeGoals(member.id);
  };

  const handleApprove = async (goalId, action) => {
    await axios.post(`${API}/api/manager/goals/${goalId}/approve`,
      { action, comment }, { headers });
    setComment("");
    setSuccess(`Goal ${action} successfully!`);
    fetchEmployeeGoals(selected.id);
    fetchTeam();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleCheckin = async (goalId) => {
    await axios.post(`${API}/api/manager/goals/${goalId}/checkin`,
      { quarter: "Q1", comment: checkinComment }, { headers });
    setCheckinComment("");
    setCheckinGoalId(null);
    setSuccess("Check-in comment added!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const statusColor = (s) => ({
    draft: "#f59e0b", pending: "#3b82f6",
    approved: "#10b981", returned: "#ef4444"
  }[s] || "#6b7280");
  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <div style={{ background: "white", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <span style={{ fontWeight: "600", fontSize: "18px" }}>AtomQuest</span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "14px", color: "#6b7280" }}>👤 {user.name}</span>
          <button onClick={logout} style={{ fontSize: "13px", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 1rem", display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "1rem" }}>My Team</h3>
          {team.map(member => (
            <div key={member.id} onClick={() => handleSelectEmployee(member)}
              style={{ background: selected?.id === member.id ? "#eff6ff" : "white", border: selected?.id === member.id ? "2px solid #2563eb" : "1px solid #e5e7eb", borderRadius: "10px", padding: "1rem", marginBottom: "10px", cursor: "pointer" }}>
              <p style={{ fontWeight: "500", fontSize: "14px" }}>{member.name}</p>
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>🟡 {member.pending_goals} pending · ✅ {member.approved_goals} approved</p>
            </div>
          ))}
          {team.length === 0 && <p style={{ fontSize: "13px", color: "#9ca3af" }}>No team members found.</p>}
        </div>

        <div>
          {!selected ? (
            <div style={{ background: "white", borderRadius: "12px", padding: "3rem", textAlign: "center", color: "#9ca3af" }}>Select a team member to view their goals</div>
          ) : (
            <>
              <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "1rem" }}>{selected.name}'s Goals</h3>
              {success && <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", fontSize: "14px" }}>{success}</div>}
              {goals.length === 0 ? (
                <div style={{ background: "white", borderRadius: "12px", padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No goals submitted yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {goals.map(goal => (
                    <div key={goal.id} style={{ background: "white", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontWeight: "600", fontSize: "15px" }}>{goal.title}</span>
                            <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "20px", background: statusColor(goal.status) + "20", color: statusColor(goal.status), fontWeight: "500" }}>{goal.status}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "#6b7280" }}>{goal.thrust_area} · Target: {goal.target} · Weightage: {goal.weightage}% · UoM: {goal.uom_type}</p>
                        </div>
                      </div>
                      {goal.status === "pending" && (
                        <div style={{ marginTop: "1rem", borderTop: "1px solid #f3f4f6", paddingTop: "1rem" }}>
                          <textarea placeholder="Add a comment (optional)" value={comment} onChange={e => setComment(e.target.value)} rows={2}
                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", boxSizing: "border-box", marginBottom: "8px" }} />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => handleApprove(goal.id, "approved")} style={{ padding: "7px 16px", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>✓ Approve</button>
                            <button onClick={() => handleApprove(goal.id, "returned")} style={{ padding: "7px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>↩ Return</button>
                          </div>
                        </div>
                      )}
                      {goal.status === "approved" && (
                        <div style={{ marginTop: "1rem", borderTop: "1px solid #f3f4f6", paddingTop: "1rem" }}>
                          {checkinGoalId === goal.id ? (
                            <div>
                              <textarea placeholder="Write check-in comment..." value={checkinComment} onChange={e => setCheckinComment(e.target.value)} rows={2}
                                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", boxSizing: "border-box", marginBottom: "8px" }} />
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={() => handleCheckin(goal.id)} style={{ padding: "7px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Save Comment</button>
                                <button onClick={() => setCheckinGoalId(null)} style={{ padding: "7px 16px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setCheckinGoalId(goal.id)} style={{ padding: "7px 16px", background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>+ Add Check-in Comment</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}