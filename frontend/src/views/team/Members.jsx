import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

export function Members({ teamId, members, canAdmin, onChanged }) {
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sorted = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.teamRole !== b.teamRole) return a.teamRole === "ADMIN" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [members]);

  async function search() {
    if (!canAdmin) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/teams/${teamId}/user-candidates`, { params: { q: q.trim() || undefined } });
      setCandidates(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to search users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCandidates([]);
    setError("");
    setQ("");
  }, [teamId]);

  async function addMember(userId) {
    await api.post(`/teams/${teamId}/members`, { userId, role: "MEMBER" });
    await onChanged?.();
    await search();
  }

  async function setRole(userId, role) {
    await api.patch(`/teams/${teamId}/members/${userId}`, { role });
    await onChanged?.();
  }

  async function remove(userId) {
    const ok = window.confirm("Remove this member from the team?");
    if (!ok) return;
    await api.delete(`/teams/${teamId}/members/${userId}`);
    await onChanged?.();
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="pad">
          <div className="row">
            <div>
              <div style={{ fontWeight: 750, letterSpacing: "-0.02em" }}>Members</div>
              <div className="subtitle">Team admins can add/remove members.</div>
            </div>
            <span className="pill">
              <strong>{members.length}</strong> total
            </span>
          </div>

          {canAdmin ? (
            <>
              <div style={{ height: 12 }} />
              <div className="grid" style={{ gridTemplateColumns: "1fr auto" }}>
                <div className="field">
                  <div className="label">Find users</div>
                  <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email" />
                </div>
                <div style={{ alignSelf: "end" }}>
                  <button className="btn" onClick={search} disabled={loading}>
                    {loading ? "Searching…" : "Search"}
                  </button>
                </div>
              </div>
              {error ? (
                <div style={{ marginTop: 10 }}>
                  <span className="pill" style={{ borderColor: "rgba(251,113,133,0.55)" }}>
                    <strong>Error</strong> {error}
                  </span>
                </div>
              ) : null}
              {candidates.length ? (
                <div style={{ marginTop: 12 }} className="stack">
                  {candidates.map((u) => (
                    <div key={u.id} className="row" style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)" }}>
                      <div>
                        <div style={{ fontWeight: 650 }}>{u.name}</div>
                        <div className="subtitle">{u.email}</div>
                      </div>
                      <button className="btn primary" onClick={() => addMember(u.id)}>
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Team role</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.userId}>
                  <td style={{ fontWeight: 650 }}>{m.name}</td>
                  <td style={{ color: "var(--muted)" }}>{m.email}</td>
                  <td>
                    <span className="pill">
                      <strong>{m.teamRole}</strong>
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {canAdmin ? (
                      <>
                        {m.teamRole === "ADMIN" ? (
                          <button className="btn" onClick={() => setRole(m.userId, "MEMBER")}>
                            Make member
                          </button>
                        ) : (
                          <button className="btn" onClick={() => setRole(m.userId, "ADMIN")}>
                            Make admin
                          </button>
                        )}{" "}
                        <button className="btn danger" onClick={() => remove(m.userId)}>
                          Remove
                        </button>
                      </>
                    ) : (
                      <span className="subtitle">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!sorted.length ? (
                <tr>
                  <td colSpan={4} style={{ padding: 16, color: "var(--muted)" }}>
                    No members found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


