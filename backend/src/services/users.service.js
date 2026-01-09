import { User } from "../models/User.js";
import { hashPassword } from "../utils/auth.js";

export async function listUsers() {
  const users = await User.find({})
    .select("_id name email role createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt
  }));
}

export async function createUser({ name, email, password, role }) {
  const normalized = String(email).toLowerCase();
  const exists = await User.findOne({ email: normalized }).lean();
  if (exists) return { ok: false, reason: "EMAIL_TAKEN" };

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email: normalized, passwordHash, role });

  return {
    ok: true,
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
  };
}

export async function updateUser(userId, { name, role, password }) {
  const update = {};
  if (name !== undefined) update.name = name;
  if (role !== undefined) update.role = role;
  if (password !== undefined) update.passwordHash = await hashPassword(password);

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
  if (!user) return null;

  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}


