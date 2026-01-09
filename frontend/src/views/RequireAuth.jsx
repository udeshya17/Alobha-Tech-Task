import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/auth";

export function RequireAuth({ children }) {
  const { token, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card">
          <div className="pad">
            <div className="title">Loading</div>
            <div className="subtitle">Getting things ready…</div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}


