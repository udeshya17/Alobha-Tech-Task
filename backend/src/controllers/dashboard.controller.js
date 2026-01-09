import { teamSummary } from "../services/dashboard.service.js";

export async function getTeamSummary(req, res) {
  const summary = await teamSummary({ teamId: req.teamId, userId: req.auth.userId });
  res.json(summary);
}


