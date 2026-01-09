import { z } from "zod";
import { loginWithEmailPassword } from "../services/auth.service.js";

export async function login(req, res) {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid credentials" });

  const result = await loginWithEmailPassword(parsed.data.email, parsed.data.password);
  if (!result) return res.status(401).json({ message: "Invalid credentials" });
  return res.json(result);
}

export async function me(req, res) {
  const u = req.user;
  return res.json({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    teams: (u.teams || []).map((t) => ({ teamId: t.teamId.toString() }))
  });
}


