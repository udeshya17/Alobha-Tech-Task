import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { loadTeam, requireTeamMember, requireTaskTeamAccess } from "../middleware/teamAccess.js";
import { getTask, getTasks, patchTask, postTask, deleteTask } from "../controllers/tasks.controller.js";

export const tasksRouter = express.Router();

tasksRouter.use(requireAuth);

tasksRouter.get("/", loadTeam, requireTeamMember(), getTasks);
tasksRouter.post("/", loadTeam, requireTeamMember(), postTask);
tasksRouter.get("/:taskId", requireTaskTeamAccess, getTask);
tasksRouter.patch("/:taskId", requireTaskTeamAccess, patchTask);
tasksRouter.delete("/:taskId", requireTaskTeamAccess, deleteTask);

