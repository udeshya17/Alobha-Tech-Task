import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./views/layout/AppShell";
import { RequireAuth } from "./views/RequireAuth";
import { Login } from "./views/Login";
import { Teams } from "./views/Teams";
import { Team } from "./views/Team";
import { Users } from "./views/Users";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/teams" replace /> },
      { path: "teams", element: <Teams /> },
      { path: "teams/:teamId", element: <Team /> },
      { path: "users", element: <Users /> }
    ]
  }
]);


