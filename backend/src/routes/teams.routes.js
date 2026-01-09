import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { loadTeam, requireTeamAdmin, requireTeamMember } from "../middleware/teamAccess.js";
import { GlobalRole } from "../models/User.js";
import { getTeam, getTeams, getUserCandidates, patchMember, postMember, postTeam, deleteMember } from "../controllers/teams.controller.js";

export const teamsRouter = express.Router();

teamsRouter.use(requireAuth);

teamsRouter.get("/", getTeams);
teamsRouter.post("/", requireRole(GlobalRole.SUPER_ADMIN), postTeam);

teamsRouter.get("/:teamId", loadTeam, requireTeamMember(), getTeam);
teamsRouter.get("/:teamId/user-candidates", loadTeam, requireTeamAdmin(), getUserCandidates);
teamsRouter.post("/:teamId/members", loadTeam, requireTeamAdmin(), postMember);
teamsRouter.patch("/:teamId/members/:userId", loadTeam, requireTeamAdmin(), patchMember);
teamsRouter.delete("/:teamId/members/:userId", loadTeam, requireTeamAdmin(), deleteMember);
