import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";

export function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/teams", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  if (token) {
    navigate("/teams", { replace: true });
    return null;
  }

  return (
    <div className="container" style={{ paddingTop: 34 }}>
      <div className="grid two">
        <div className="card">
          <div className="pad">
            <div className="title">Welcome</div>
            <div className="subtitle">
              Sign in to manage teams and tasks with role + team based access.
            </div>
            <div style={{ height: 18 }} />
            <div className="stack">
              <span className="pill">
                <strong>JWT</strong> session
              </span>
              <span className="pill">
                <strong>Teams</strong> + members
              </span>
              <span className="pill">
                <strong>Tasks</strong> within a team
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="pad">
            <div className="row">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  Sign in
                </div>
                <div className="subtitle">Use your seeded admin or a created user.</div>
              </div>
            </div>

            <div style={{ height: 14 }} />

            <form className="stack" onSubmit={onSubmit}>
              <div className="field">
                <div className="label">Email</div>
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="field">
                <div className="label">Password</div>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error ? (
                <div className="pill" style={{ borderColor: "rgba(251,113,133,0.55)", color: "rgba(255,255,255,0.9)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(251,113,133,0.95)" }} />
                  <span>{error}</span>
                </div>
              ) : null}

              <button className="btn primary" type="submit" disabled={busy || !email.trim() || !password}>
                {busy ? "Signing in…" : "Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


