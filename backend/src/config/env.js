import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongodbUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  seedSuperAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL || "admin@demo.com",
  seedSuperAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD || "Admin@12345",
  seedSuperAdminName: process.env.SEED_SUPER_ADMIN_NAME || "Super Admin"
};
