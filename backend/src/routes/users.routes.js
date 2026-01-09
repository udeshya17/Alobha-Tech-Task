import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { GlobalRole } from "../models/User.js";
import { getUsers, patchUser, postUser } from "../controllers/users.controller.js";

export const usersRouter = express.Router();

usersRouter.use(requireAuth);
usersRouter.use(requireRole(GlobalRole.SUPER_ADMIN));

usersRouter.get("/", getUsers);
usersRouter.post("/", postUser);
usersRouter.patch("/:userId", patchUser);

