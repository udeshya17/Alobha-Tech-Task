import mongoose from "mongoose";
import { Team, TeamRole } from "../models/Team.js";
import { User, GlobalRole } from "../models/User.js";
import { Task } from "../models/Task.js";

export function isSuperAdmin(req) {
  return req?.auth?.role === GlobalRole.SUPER_ADMIN;
}

export async function loadTeam(req, res, next) {
  const teamId = req.params.teamId || req.query.teamId || req.body.teamId;
  if (!teamId || !mongoose.isValidObjectId(teamId)) {
    return res.status(400).json({ message: "Invalid teamId" });
  }
  const team = await Team.findById(teamId).lean();
  if (!team) return res.status(404).json({ message: "Team not found" });
  req.team = team;
  req.teamId = team._id.toString();
  return next();
}

export function isTeamAdmin(team, userId) {
  return (team?.members || []).some(
    (m) => m.userId.toString() === userId && m.role === TeamRole.ADMIN
  );
}

export function requireTeamMember() {
  return async (req, res, next) => {
    if (isSuperAdmin(req)) return next();
    const ok = (req.team?.members || []).some((m) => m.userId.toString() === req.auth.userId);
    if (!ok) return res.status(403).json({ message: "Not a member of this team" });
    return next();
  };
}

export function requireTeamAdmin() {
  return async (req, res, next) => {
    if (isSuperAdmin(req)) return next();
    if (!isTeamAdmin(req.team, req.auth.userId)) {
      return res.status(403).json({ message: "Team admin access required" });
    }
    return next();
  };
}

export async function requireTaskTeamAccess(req, res, next) {
  const taskId = req.params.taskId;
  if (!taskId || !mongoose.isValidObjectId(taskId)) {
    return res.status(400).json({ message: "Invalid taskId" });
  }
  const task = await Task.findById(taskId).lean();
  if (!task || task.deletedAt) return res.status(404).json({ message: "Task not found" });
  req.task = task;

  if (isSuperAdmin(req)) return next();

  const team = await Team.findById(task.teamId).lean();
  if (!team) return res.status(404).json({ message: "Team not found" });
  req.team = team;
  req.teamId = team._id.toString();

  const ok = (team.members || []).some((m) => m.userId.toString() === req.auth.userId);
  if (!ok) return res.status(403).json({ message: "Not a member of this team" });
  return next();
}

export async function ensureAssigneeInTeam(teamId, assigneeId) {
  if (!assigneeId) return true;
  if (!mongoose.isValidObjectId(assigneeId)) return false;
  const team = await Team.findById(teamId).lean();
  if (!team) return false;
  return (team.members || []).some((m) => m.userId.toString() === assigneeId.toString());
}

export async function syncUserTeamMembership(teamId) {
  const team = await Team.findById(teamId).lean();
  if (!team) return;
  const memberIds = new Set((team.members || []).map((m) => m.userId.toString()));

  await User.updateMany(
    { "teams.teamId": teamId, _id: { $nin: Array.from(memberIds) } },
    { $pull: { teams: { teamId } } }
  );
  await User.updateMany(
    { _id: { $in: Array.from(memberIds) }, "teams.teamId": { $ne: teamId } },
    { $push: { teams: { teamId } } }
  );
}
