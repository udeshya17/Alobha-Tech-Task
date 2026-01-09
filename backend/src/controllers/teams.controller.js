import { z } from "zod";
import { GlobalRole } from "../models/User.js";
import { TeamRole } from "../models/Team.js";
import {
  addTeamMember,
  createTeam,
  findUserCandidates,
  getTeamWithMembers,
  listTeamsForUser,
  removeTeamMember,
  updateTeamMemberRole
} from "../services/teams.service.js";

export async function getTeams(req, res) {
  const teams = await listTeamsForUser(req.user);
  res.json(teams);
}

export async function postTeam(req, res) {
  const schema = z.object({ name: z.string().min(1).max(80), initialAdminUserId: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const result = await createTeam({
    name: parsed.data.name,
    createdBy: req.auth.userId,
    initialAdminUserId: parsed.data.initialAdminUserId,
    TeamRole
  });
  if (!result.ok && result.reason === "INITIAL_ADMIN_NOT_FOUND") {
    return res.status(404).json({ message: "Initial admin user not found" });
  }
  return res.status(201).json(result.team);
}

export async function getTeam(req, res) {
  const dto = await getTeamWithMembers(req.team);
  res.json(dto);
}

export async function getUserCandidates(req, res) {
  const users = await findUserCandidates({ team: req.team, q: req.query.q });
  res.json(users);
}

export async function postMember(req, res) {
  const schema = z.object({
    userId: z.string().min(1),
    role: z.enum([TeamRole.ADMIN, TeamRole.MEMBER]).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const result = await addTeamMember({
    teamId: req.teamId,
    userId: parsed.data.userId,
    role: parsed.data.role || TeamRole.MEMBER
  });
  if (!result.ok && result.reason === "USER_NOT_FOUND") return res.status(404).json({ message: "User not found" });
  if (!result.ok && result.reason === "ALREADY_MEMBER") return res.status(409).json({ message: "User already in team" });
  return res.status(201).json({ ok: true });
}

export async function patchMember(req, res) {
  const schema = z.object({ role: z.enum([TeamRole.ADMIN, TeamRole.MEMBER]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const result = await updateTeamMemberRole({ teamId: req.teamId, userId: req.params.userId, role: parsed.data.role });
  if (!result.ok) return res.status(404).json({ message: "Member not found" });
  return res.json({ ok: true });
}

export async function deleteMember(req, res) {
  await removeTeamMember({ teamId: req.teamId, userId: req.params.userId });
  return res.json({ ok: true });
}

export const roles = { GlobalRole, TeamRole };


