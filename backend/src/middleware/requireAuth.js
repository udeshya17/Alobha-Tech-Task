import { verifyAccessToken } from "../utils/auth.js";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).lean();
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.auth = { userId: user._id.toString(), role: user.role };
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
