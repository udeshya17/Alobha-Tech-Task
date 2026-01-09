import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { syncUserTeamMembership } from "../middleware/teamAccess.js";

export async function listTeamsForUser(user) {
  if (user.role === "SUPER_ADMIN") {
    const teams = await Team.find({}).sort({ createdAt: -1 }).lean();
    return teams.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      membersCount: (t.members || []).length,
      createdAt: t.createdAt
    }));
  }

  const teamIds = (user.teams || []).map((t) => t.teamId);
  const teams = await Team.find({ _id: { $in: teamIds } }).sort({ createdAt: -1 }).lean();
  return teams.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    membersCount: (t.members || []).length,
    createdAt: t.createdAt
  }));
}

export async function createTeam({ name, createdBy, initialAdminUserId, TeamRole }) {
  let members = [];
  if (initialAdminUserId) {
    const admin = await User.findById(initialAdminUserId).lean();
    if (!admin) return { ok: false, reason: "INITIAL_ADMIN_NOT_FOUND" };
    members = [{ userId: admin._id, role: TeamRole.ADMIN }];
  }

  const team = await Team.create({ name, createdBy, members });
  await syncUserTeamMembership(team._id);
  return { ok: true, team: { id: team._id.toString(), name: team.name } };
}

export async function getTeamWithMembers(team) {
  const users = await User.find({ _id: { $in: team.members.map((m) => m.userId) } })
    .select("_id name email role")
    .lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return {
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
  };
}

export async function findUserCandidates({ team, q }) {
  const query = String(q || "").trim();
  const teamMemberIds = new Set((team.members || []).map((m) => m.userId.toString()));

  const filter = {};
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } }
    ];
  }

  const users = await User.find(filter).select("_id name email role").limit(20).lean();
  return users
    .filter((u) => !teamMemberIds.has(u._id.toString()))
    .map((u) => ({ id: u._id.toString(), name: u.name, email: u.email, role: u.role }));
}

export async function addTeamMember({ teamId, userId, role }) {
  const user = await User.findById(userId).lean();
  if (!user) return { ok: false, reason: "USER_NOT_FOUND" };

  const team = await Team.findById(teamId).lean();
  if (!team) return { ok: false, reason: "TEAM_NOT_FOUND" };

  const exists = (team.members || []).some((m) => m.userId.toString() === user._id.toString());
  if (exists) return { ok: false, reason: "ALREADY_MEMBER" };

  await Team.updateOne({ _id: teamId }, { $push: { members: { userId: user._id, role } } });
  await syncUserTeamMembership(teamId);
  return { ok: true };
}

export async function updateTeamMemberRole({ teamId, userId, role }) {
  const team = await Team.findOneAndUpdate(
    { _id: teamId, "members.userId": userId },
    { $set: { "members.$.role": role } },
    { new: true }
  ).lean();
  if (!team) return { ok: false, reason: "MEMBER_NOT_FOUND" };
  return { ok: true };
}

export async function removeTeamMember({ teamId, userId }) {
  await Team.updateOne({ _id: teamId }, { $pull: { members: { userId } } });
  await syncUserTeamMembership(teamId);
  return { ok: true };
}


