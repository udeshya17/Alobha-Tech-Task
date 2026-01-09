import { connectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { User, GlobalRole } from "../models/User.js";
import { hashPassword } from "../utils/auth.js";

await connectDb();

const email = env.seedSuperAdminEmail.toLowerCase();
const existing = await User.findOne({ email });

if (existing) {
  console.log(`Super Admin already exists: ${email}`);
  process.exit(0);
}

const passwordHash = await hashPassword(env.seedSuperAdminPassword);
await User.create({
  name: env.seedSuperAdminName,
  email,
  passwordHash,
  role: GlobalRole.SUPER_ADMIN
});

console.log(`Seeded Super Admin: ${email}`);
process.exit(0);

