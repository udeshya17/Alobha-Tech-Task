import { z } from "zod";
import { GlobalRole } from "../models/User.js";
import { createUser, listUsers, updateUser } from "../services/users.service.js";

export async function getUsers(req, res) {
  const users = await listUsers();
  res.json(users);
}

export async function postUser(req, res) {
  const schema = z.object({
    name: z.string().min(1).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: z.enum([GlobalRole.SUPER_ADMIN, GlobalRole.TEAM_ADMIN, GlobalRole.TEAM_MEMBER])
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const result = await createUser(parsed.data);
  if (!result.ok && result.reason === "EMAIL_TAKEN") {
    return res.status(409).json({ message: "Email already in use" });
  }
  return res.status(201).json(result.user);
}

export async function patchUser(req, res) {
  const schema = z.object({
    name: z.string().min(1).max(80).optional(),
    role: z.enum([GlobalRole.SUPER_ADMIN, GlobalRole.TEAM_ADMIN, GlobalRole.TEAM_MEMBER]).optional(),
    password: z.string().min(8).max(72).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const user = await updateUser(req.params.userId, parsed.data);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json(user);
}


