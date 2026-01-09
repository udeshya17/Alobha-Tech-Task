import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../state/auth";
import { Tasks } from "./team/Tasks";
import { Members } from "./team/Members";

export function Team() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { me, role } = useAuth();

  const [team, setTeam] = useState(null);
  const [summary, setSummary] = useState(null);
  const [tab, setTab] = useState("tasks");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canAdmin = useMemo(() => {
    if (role === "SUPER_ADMIN") return true;
    const m = team?.members?.find((x) => x.userId === me?.id);
    return m?.teamRole === "ADMIN";
  }, [role, team?.members, me?.id]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [t, s] = await Promise.all([
        api.get(`/teams/${teamId}`),
        api.get(`/dashboard/teams/${teamId}/summary`)
      ]);
      setTeam(t.data);
      setSummary(s.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [teamId]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 18 }}>
        <div className="card">
          <div className="pad">
            <div className="title">Loading team</div>
            <div className="subtitle">Fetching members, tasks, and summary…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 18 }}>
        <div className="card">
          <div className="pad">
            <div className="title">Team</div>
            <div style={{ height: 12 }} />
            <span className="pill" style={{ borderColor: "rgba(251,113,133,0.55)" }}>
              <strong>Error</strong> {error}
            </span>
            <div style={{ height: 12 }} />
            <button className="btn" onClick={() => navigate("/teams")}>
              Back to teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  const members = team?.members || [];

  return (
    <div className="container">
      <div className="row">
        <div>
          <div className="title">{team?.name}</div>
          <div className="subtitle">Dashboard for tasks inside this team.</div>
        </div>
        <div className="tabs">
          <button className={tab === "tasks" ? "tab active" : "tab"} onClick={() => setTab("tasks")}>
            Tasks
          </button>
          <button className={tab === "members" ? "tab active" : "tab"} onClick={() => setTab("members")}>
            Members
          </button>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <div className="pad">
          <div className="kpi">
            <div className="box">
              <div className="num">{summary?.total ?? 0}</div>
              <div className="cap">Total tasks</div>
            </div>
            <div className="box">
              <div className="num">{summary?.byStatus?.TODO ?? 0}</div>
              <div className="cap">To do</div>
            </div>
            <div className="box">
              <div className="num">{summary?.byStatus?.IN_PROGRESS ?? 0}</div>
              <div className="cap">In progress</div>
            </div>
            <div className="box">
              <div className="num">{summary?.byStatus?.DONE ?? 0}</div>
              <div className="cap">Done</div>
            </div>
          </div>
          <div style={{ height: 10 }} />
          <div className="row">
            <span className="pill">
              <strong>Overdue</strong> {summary?.overdue ?? 0}
            </span>
            <span className="pill">
              <strong>Mine</strong> {summary?.mine ?? 0}
            </span>
            <span className="pill">
              <strong>Access</strong> {canAdmin ? "Team admin" : "Member"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      {tab === "tasks" ? (
        <Tasks teamId={teamId} members={members} canAdmin={canAdmin} />
      ) : (
        <Members teamId={teamId} members={members} canAdmin={canAdmin} onChanged={load} />
      )}
    </div>
  );
}


