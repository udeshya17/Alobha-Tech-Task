import { z } from "zod";
import mongoose from "mongoose";
import { GlobalRole } from "../models/User.js";
import { TaskPriority, TaskStatus } from "../models/Task.js";
import { ensureAssigneeInTeam, isTeamAdmin } from "../middleware/teamAccess.js";
import { buildTaskListQuery, createTask, listTasks, softDeleteTask, taskSort, toTaskDto, updateTask } from "../services/tasks.service.js";

export async function getTasks(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize || 10)));
  const q = String(req.query.q || "").trim();
  const status = req.query.status ? String(req.query.status) : null;
  const assigneeId = req.query.assigneeId ? String(req.query.assigneeId) : null;
  const sort = String(req.query.sort || "-createdAt");

  const filter = buildTaskListQuery({ teamId: req.teamId, q, status, assigneeId, TaskStatus });
  const { items, total } = await listTasks({ filter, sort: taskSort(sort), page, pageSize });

  res.json({ items: items.map(toTaskDto), total, page, pageSize });
}

export async function postTask(req, res) {
  const schema = z.object({
    teamId: z.string().min(1),
    title: z.string().min(1).max(140),
    description: z.string().max(5000).optional(),
    status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]).optional(),
    priority: z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    assigneeId: z.string().optional().nullable()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const ok = await ensureAssigneeInTeam(req.teamId, parsed.data.assigneeId);
  if (!ok) return res.status(400).json({ message: "Assignee must be in the same team" });

  const task = await createTask({
    teamId: req.teamId,
    title: parsed.data.title,
    description: parsed.data.description || "",
    status: parsed.data.status || TaskStatus.TODO,
    priority: parsed.data.priority || TaskPriority.MEDIUM,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    assigneeId: parsed.data.assigneeId ? parsed.data.assigneeId : null,
    createdBy: req.auth.userId
  });

  res.status(201).json(toTaskDto(task));
}

export async function getTask(req, res) {
  res.json(toTaskDto(req.task));
}

export async function patchTask(req, res) {
  const schema = z.object({
    title: z.string().min(1).max(140).optional(),
    description: z.string().max(5000).optional(),
    status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]).optional(),
    priority: z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    assigneeId: z.string().optional().nullable()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const teamAdmin = req.auth.role === GlobalRole.SUPER_ADMIN || isTeamAdmin(req.team, req.auth.userId);
  const isCreator = req.task.createdBy?.toString() === req.auth.userId;
  const isAssignee = req.task.assigneeId?.toString() === req.auth.userId;

  if (!teamAdmin && !isCreator && !isAssignee) {
    return res.status(403).json({ message: "Not allowed to update this task" });
  }

  if (!teamAdmin && parsed.data.assigneeId !== undefined) {
    return res.status(403).json({ message: "Only a team admin can reassign tasks" });
  }

  if (parsed.data.assigneeId !== undefined) {
    const ok = await ensureAssigneeInTeam(req.teamId, parsed.data.assigneeId);
    if (!ok) return res.status(400).json({ message: "Assignee must be in the same team" });
  }

  const update = {};
  for (const key of ["title", "description", "status", "priority"]) {
    if (parsed.data[key] !== undefined) update[key] = parsed.data[key];
  }
  if (parsed.data.dueDate !== undefined) update.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  if (parsed.data.assigneeId !== undefined) {
    update.assigneeId = parsed.data.assigneeId ? new mongoose.Types.ObjectId(parsed.data.assigneeId) : null;
  }
  update.updatedBy = req.auth.userId;

  const saved = await updateTask(req.task._id, update);
  res.json(toTaskDto(saved));
}

export async function deleteTask(req, res) {
  const teamAdmin = req.auth.role === GlobalRole.SUPER_ADMIN || isTeamAdmin(req.team, req.auth.userId);
  if (!teamAdmin) return res.status(403).json({ message: "Team admin access required" });

  await softDeleteTask(req.task._id, req.auth.userId);
  res.json({ ok: true });
}


