import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth";
import { api } from "../../lib/api";

export function AppShell() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    let alive = true;
    api
      .get("/teams")
      .then((r) => alive && setTeams(r.data || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const firstTeamId = useMemo(() => teams[0]?.id || null, [teams]);
  const dashboardActive = location.pathname.startsWith("/teams/") && location.pathname !== "/teams";

  return (
    <>
      <div className="topbar">
        <div className="container">
          <div className="topbar-inner">
            <div className="brand" onClick={() => navigate("/teams")} role="button" tabIndex={0}>
              <span className="dot" />
              <span>Team Task Manager</span>
            </div>

            <div className="nav">
              <NavLink to="/teams" className={({ isActive }) => (isActive ? "active" : "")}>
                Teams
              </NavLink>
              {me?.role === "SUPER_ADMIN" ? (
                <NavLink to="/users" className={({ isActive }) => (isActive ? "active" : "")}>
                  Users
                </NavLink>
              ) : null}
              {firstTeamId ? (
                <a
                  href="#"
                  className={dashboardActive ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/teams/${firstTeamId}`);
                  }}
                >
                  Dashboard
                </a>
              ) : null}
            </div>

            <div className="user">
              <div className="user-meta">
                <div className="name">{me?.name}</div>
                <div className="role">{me?.role}</div>
              </div>
              <button className="btn" onClick={logout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <Outlet />

      <div className="footer-space" />
    </>
  );
}


