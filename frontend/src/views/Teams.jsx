import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../state/auth";

export function Teams() {
  const { role } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const isSuper = role === "SUPER_ADMIN";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/teams");
      setItems(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createTeam(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setError("");
    try {
      await api.post("/teams", { name: trimmed });
      setName("");
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  const status = useMemo(() => {
    if (loading) return "Loading teams…";
    if (error) return error;
    if (!items.length) return "No teams yet.";
    return "";
  }, [loading, error, items.length]);

  return (
    <div className="container">
      <div className="row">
        <div>
          <div className="title">Teams</div>
          <div className="subtitle">Choose a team to view dashboard and tasks.</div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      {isSuper ? (
        <div className="card">
          <div className="pad">
            <div className="row">
              <div style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Create team</div>
              <span className="pill">
                <strong>Super Admin</strong> only
              </span>
            </div>
            <div style={{ height: 12 }} />
            <form className="row" onSubmit={createTeam}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <input
                  className="input"
                  placeholder="Team name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button className="btn primary" type="submit" disabled={creating || !name.trim()}>
                {creating ? "Creating…" : "Create"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div style={{ height: 14 }} />

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {items.map((t) => (
          <Link key={t.id} to={`/teams/${t.id}`} className="card">
            <div className="pad">
              <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: "-0.02em" }}>{t.name}</div>
              <div className="subtitle">{t.membersCount} members</div>
              <div style={{ height: 12 }} />
              <div className="row">
                <span className="pill">
                  <strong>Open</strong> dashboard
                </span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {status ? (
        <div style={{ marginTop: 14 }}>
          <span className="pill">
            <strong>Status</strong> {status}
          </span>
        </div>
      ) : null}
    </div>
  );
}


