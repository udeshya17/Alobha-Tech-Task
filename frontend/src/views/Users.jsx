import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../state/auth";

export function Users() {
  const { role } = useAuth();
  const isSuper = role === "SUPER_ADMIN";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("TEAM_MEMBER");
  const [creating, setCreating] = useState(false);

  const [editUserId, setEditUserId] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("TEAM_MEMBER");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users");
      setItems(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isSuper) load();
  }, [isSuper]);

  async function create(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) return;
    setCreating(true);
    setError("");
    try {
      await api.post("/users", {
        name: name.trim(),
        email: email.trim(),
        password,
        role: userRole
      });
      setName("");
      setEmail("");
      setPassword("");
      setUserRole("TEAM_MEMBER");
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(u) {
    setEditUserId(u.id);
    setEditName(u.name);
    setEditRole(u.role);
    setEditPassword("");
  }

  function cancelEdit() {
    setEditUserId("");
    setEditName("");
    setEditRole("TEAM_MEMBER");
    setEditPassword("");
  }

  async function saveEdit() {
    if (!editUserId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: editName.trim() || undefined,
        role: editRole || undefined,
        password: editPassword ? editPassword : undefined
      };
      await api.patch(`/users/${editUserId}`, payload);
      cancelEdit();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  const status = useMemo(() => {
    if (!isSuper) return "Super Admin only.";
    if (loading) return "Loading users…";
    if (error) return error;
    return "";
  }, [isSuper, loading, error]);

  if (!isSuper) {
    return (
      <div className="container">
        <div className="card">
          <div className="pad">
            <div className="title">Users</div>
            <div className="subtitle">Only Super Admin can manage users.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div>
          <div className="title">Users</div>
          <div className="subtitle">Create and manage system users.</div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <div className="pad">
          <div className="row">
            <div style={{ fontWeight: 750, letterSpacing: "-0.02em" }}>Create user</div>
            <span className="pill">
              <strong>Super Admin</strong> only
            </span>
          </div>
          <div style={{ height: 12 }} />
          <form className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }} onSubmit={create}>
            <div className="field">
              <div className="label">Name</div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">Email</div>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">Password</div>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">Role</div>
              <select className="select" value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                <option value="TEAM_MEMBER">TEAM_MEMBER</option>
                <option value="TEAM_ADMIN">TEAM_ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>
            <div style={{ alignSelf: "end" }}>
              <button className="btn primary" type="submit" disabled={creating || !name.trim() || !email.trim() || password.length < 8}>
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
          {error ? (
            <div style={{ marginTop: 10 }}>
              <span className="pill" style={{ borderColor: "rgba(251,113,133,0.55)" }}>
                <strong>Error</strong> {error}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="pad">
          <div className="row">
            <div style={{ fontWeight: 750, letterSpacing: "-0.02em" }}>All users</div>
            <span className="pill">
              <strong>{items.length}</strong> total
            </span>
          </div>
          {status ? <div style={{ marginTop: 10 }} className="subtitle">{status}</div> : null}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 650 }}>{u.name}</td>
                  <td style={{ color: "var(--muted)" }}>{u.email}</td>
                  <td>
                    <span className="pill">
                      <strong>{u.role}</strong>
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn" onClick={() => startEdit(u)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && !loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 16, color: "var(--muted)" }}>
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {editUserId ? (
        <div className="modal" onMouseDown={cancelEdit}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pad">
              <div className="row">
                <div>
                  <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: "-0.02em" }}>Edit user</div>
                  <div className="subtitle">Update name, role, or reset password.</div>
                </div>
                <button className="btn" onClick={cancelEdit}>
                  Close
                </button>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }} />
            <div className="modal-body">
              <div className="pad">
                <div className="stack">
                  <div className="field">
                    <div className="label">Name</div>
                    <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="field">
                    <div className="label">Role</div>
                    <select className="select" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                      <option value="TEAM_MEMBER">TEAM_MEMBER</option>
                      <option value="TEAM_ADMIN">TEAM_ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </div>
                  <div className="field">
                    <div className="label">New password (optional)</div>
                    <input
                      className="input"
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave empty to keep unchanged"
                    />
                  </div>
                  <div className="row" style={{ justifyContent: "flex-end" }}>
                    <button className="btn" onClick={cancelEdit} disabled={saving}>
                      Cancel
                    </button>
                    <button className="btn primary" onClick={saveEdit} disabled={saving}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


