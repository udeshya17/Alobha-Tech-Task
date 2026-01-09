import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { GlobalRole, User } from "../models/User.js";
import { hashPassword } from "../utils/auth.js";

export const usersRouter = express.Router();

usersRouter.use(requireAuth);
usersRouter.use(requireRole(GlobalRole.SUPER_ADMIN));

usersRouter.get("/", async (req, res) => {
  const users = await User.find({})
    .select("_id name email role createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.json(
    users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }))
  );
});

usersRouter.post("/", async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: z.enum([GlobalRole.SUPER_ADMIN, GlobalRole.TEAM_ADMIN, GlobalRole.TEAM_MEMBER])
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const email = parsed.data.email.toLowerCase();
  const exists = await User.findOne({ email }).lean();
  if (exists) return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await User.create({
    name: parsed.data.name,
    email,
    passwordHash,
    role: parsed.data.role
  });

  res.status(201).json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  });
});

usersRouter.patch("/:userId", async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(80).optional(),
    role: z.enum([GlobalRole.SUPER_ADMIN, GlobalRole.TEAM_ADMIN, GlobalRole.TEAM_MEMBER]).optional(),
    password: z.string().min(8).max(72).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const update = {};
  if (parsed.data.name) update.name = parsed.data.name;
  if (parsed.data.role) update.role = parsed.data.role;
  if (parsed.data.password) update.passwordHash = await hashPassword(parsed.data.password);

  const user = await User.findByIdAndUpdate(req.params.userId, update, { new: true }).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  });
});

