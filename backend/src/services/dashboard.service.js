import mongoose from "mongoose";
import { Task, TaskStatus } from "../models/Task.js";

export async function teamSummary({ teamId, userId }) {
  const tId = new mongoose.Types.ObjectId(teamId);
  const uId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const base = { teamId: tId, deletedAt: null };

  const [total, todo, inProgress, done, overdue, mine] = await Promise.all([
    Task.countDocuments(base),
    Task.countDocuments({ ...base, status: TaskStatus.TODO }),
    Task.countDocuments({ ...base, status: TaskStatus.IN_PROGRESS }),
    Task.countDocuments({ ...base, status: TaskStatus.DONE }),
    Task.countDocuments({ ...base, status: { $ne: TaskStatus.DONE }, dueDate: { $lt: now } }),
    Task.countDocuments({ ...base, assigneeId: uId })
  ]);

  return {
    total,
    byStatus: { TODO: todo, IN_PROGRESS: inProgress, DONE: done },
    overdue,
    mine
  };
}


