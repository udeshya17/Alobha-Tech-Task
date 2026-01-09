import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { loadTeam, requireTeamAdmin, requireTeamMember, syncUserTeamMembership } from "../middleware/teamAccess.js";
import { GlobalRole, User } from "../models/User.js";
import { Team, TeamRole } from "../models/Team.js";

export const teamsRouter = express.Router();

teamsRouter.use(requireAuth);

teamsRouter.get("/", async (req, res) => {
  if (req.auth.role === GlobalRole.SUPER_ADMIN) {
    const teams = await Team.find({}).sort({ createdAt: -1 }).lean();
    return res.json(
      teams.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        membersCount: (t.members || []).length,
        createdAt: t.createdAt
      }))
    );
  }

  const teamIds = (req.user.teams || []).map((t) => t.teamId);
  const teams = await Team.find({ _id: { $in: teamIds } }).sort({ createdAt: -1 }).lean();
  return res.json(
    teams.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      membersCount: (t.members || []).length,
      createdAt: t.createdAt
    }))
  );
});

teamsRouter.post("/", requireRole(GlobalRole.SUPER_ADMIN), async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(80),
    initialAdminUserId: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  let members = [];
  if (parsed.data.initialAdminUserId) {
    const admin = await User.findById(parsed.data.initialAdminUserId).lean();
    if (!admin) return res.status(404).json({ message: "Initial admin user not found" });
    members = [{ userId: admin._id, role: TeamRole.ADMIN }];
  }

  const team = await Team.create({
    name: parsed.data.name,
    createdBy: req.auth.userId,
    members
  });

  await syncUserTeamMembership(team._id);

  res.status(201).json({ id: team._id.toString(), name: team.name });
});

teamsRouter.get("/:teamId", loadTeam, requireTeamMember(), async (req, res) => {
  const team = req.team;

  const users = await User.find({ _id: { $in: team.members.map((m) => m.userId) } })
    .select("_id name email role")
    .lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  res.json({
    id: team._id.toString(),
    name: team.name,
    members: team.members.map((m) => {
      const u = userMap.get(m.userId.toString());
      return {
        userId: m.userId.toString(),
        teamRole: m.role,
        name: u?.name || "Unknown",
        email: u?.email || ""
      };
    })
  });
});

teamsRouter.get("/:teamId/user-candidates", loadTeam, requireTeamAdmin(), async (req, res) => {
  const q = String(req.query.q || "").trim();
  const teamMemberIds = new Set((req.team.members || []).map((m) => m.userId.toString()));

  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } }
    ];
  }

  const users = await User.find(filter).select("_id name email role").limit(20).lean();

  res.json(
    users
      .filter((u) => !teamMemberIds.has(u._id.toString()))
      .map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role
      }))
  );
});

teamsRouter.post("/:teamId/members", loadTeam, requireTeamAdmin(), async (req, res) => {
  const schema = z.object({
    userId: z.string().min(1),
    role: z.enum([TeamRole.ADMIN, TeamRole.MEMBER]).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const user = await User.findById(parsed.data.userId).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  const role = parsed.data.role || TeamRole.MEMBER;
  const teamId = req.teamId;

  const exists = (req.team.members || []).some((m) => m.userId.toString() === user._id.toString());
  if (exists) return res.status(409).json({ message: "User already in team" });

  await Team.updateOne({ _id: teamId }, { $push: { members: { userId: user._id, role } } });
  await syncUserTeamMembership(teamId);

  res.status(201).json({ ok: true });
});

teamsRouter.patch("/:teamId/members/:userId", loadTeam, requireTeamAdmin(), async (req, res) => {
  const schema = z.object({ role: z.enum([TeamRole.ADMIN, TeamRole.MEMBER]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const teamId = req.teamId;
  const userId = req.params.userId;

  const team = await Team.findOneAndUpdate(
    { _id: teamId, "members.userId": userId },
    { $set: { "members.$.role": parsed.data.role } },
    { new: true }
  ).lean();

  if (!team) return res.status(404).json({ message: "Member not found" });
  res.json({ ok: true });
});

teamsRouter.delete("/:teamId/members/:userId", loadTeam, requireTeamAdmin(), async (req, res) => {
  const teamId = req.teamId;
  const userId = req.params.userId;

  await Team.updateOne({ _id: teamId }, { $pull: { members: { userId } } });
  await syncUserTeamMembership(teamId);

  res.json({ ok: true });
});
