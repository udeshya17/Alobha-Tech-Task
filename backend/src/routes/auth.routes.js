import express from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { signAccessToken, verifyPassword } from "../utils/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid credentials" });

  const email = parsed.data.email.toLowerCase();
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signAccessToken({ userId: user._id.toString(), role: user.role });
  return res.json({
    token,
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const u = req.user;
  return res.json({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    teams: (u.teams || []).map((t) => ({ teamId: t.teamId.toString() }))
  });
});
