import mongoose from "mongoose";
import { Task } from "../models/Task.js";

export function buildTaskListQuery({ teamId, q, status, assigneeId, TaskStatus }) {
  const filter = { teamId: new mongoose.Types.ObjectId(teamId), deletedAt: null };
  const query = String(q || "").trim();

  if (status && Object.values(TaskStatus).includes(status)) filter.status = status;
  if (assigneeId && mongoose.isValidObjectId(assigneeId)) {
    filter.assigneeId = new mongoose.Types.ObjectId(assigneeId);
  }
  if (query) {
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, "i");
    filter.$or = [{ title: re }, { description: re }];
  }
  return filter;
}

export function taskSort(sort) {
  const sortMap = {
    createdAt: { createdAt: 1 },
    "-createdAt": { createdAt: -1 },
    dueDate: { dueDate: 1, createdAt: -1 },
    "-dueDate": { dueDate: -1, createdAt: -1 },
    "-priority": { priority: -1, createdAt: -1 }
  };
  return sortMap[String(sort || "-createdAt")] || sortMap["-createdAt"];
}

export async function listTasks({ filter, sort, page, pageSize }) {
  const [items, total] = await Promise.all([
    Task.find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Task.countDocuments(filter)
  ]);
  return { items, total };
}

export async function createTask(payload) {
  return Task.create(payload);
}

export async function updateTask(taskId, update) {
  return Task.findByIdAndUpdate(taskId, update, { new: true }).lean();
}

export async function softDeleteTask(taskId, userId) {
  await Task.updateOne({ _id: taskId }, { $set: { deletedAt: new Date(), updatedBy: userId } });
}

export function toTaskDto(t) {
  return {
    id: t._id.toString(),
    teamId: t.teamId.toString(),
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    assigneeId: t.assigneeId ? t.assigneeId.toString() : null,
    deletedAt: t.deletedAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt
  };
}


