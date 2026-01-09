import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/requireAuth.js";
import { loadTeam, requireTeamMember } from "../middleware/teamAccess.js";
import { Task, TaskStatus } from "../models/Task.js";

export const dashboardRouter = express.Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/teams/:teamId/summary", loadTeam, requireTeamMember(), async (req, res) => {
  const teamId = new mongoose.Types.ObjectId(req.teamId);
  const userId = new mongoose.Types.ObjectId(req.auth.userId);
  const now = new Date();

  const base = { teamId, deletedAt: null };

  const [total, todo, inProgress, done, overdue, mine] = await Promise.all([
    Task.countDocuments(base),
    Task.countDocuments({ ...base, status: TaskStatus.TODO }),
    Task.countDocuments({ ...base, status: TaskStatus.IN_PROGRESS }),
    Task.countDocuments({ ...base, status: TaskStatus.DONE }),
    Task.countDocuments({ ...base, status: { $ne: TaskStatus.DONE }, dueDate: { $lt: now } }),
    Task.countDocuments({ ...base, assigneeId: userId })
  ]);

  res.json({
    total,
    byStatus: { TODO: todo, IN_PROGRESS: inProgress, DONE: done },
    overdue,
    mine
  });
});

