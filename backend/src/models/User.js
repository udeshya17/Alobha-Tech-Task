import mongoose from "mongoose";

export const GlobalRole = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  TEAM_ADMIN: "TEAM_ADMIN",
  TEAM_MEMBER: "TEAM_MEMBER"
});

const membershipSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(GlobalRole), default: GlobalRole.TEAM_MEMBER, index: true },
    teams: { type: [membershipSchema], default: [] }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
