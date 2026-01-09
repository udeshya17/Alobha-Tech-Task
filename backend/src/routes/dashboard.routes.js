import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { loadTeam, requireTeamMember } from "../middleware/teamAccess.js";
import { getTeamSummary } from "../controllers/dashboard.controller.js";

export const dashboardRouter = express.Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/teams/:teamId/summary", loadTeam, requireTeamMember(), getTeamSummary);

