import { User } from "../models/User.js";
import { signAccessToken, verifyPassword } from "../utils/auth.js";

export async function loginWithEmailPassword(email, password) {
  const normalized = String(email).toLowerCase();
  const user = await User.findOne({ email: normalized });
  if (!user) return null;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  const token = signAccessToken({ userId: user._id.toString(), role: user.role });
  return {
    token,
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
  };
}


