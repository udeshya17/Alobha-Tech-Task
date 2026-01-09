import mongoose from "mongoose";

export const TeamRole = Object.freeze({
  ADMIN: "ADMIN",
  MEMBER: "MEMBER"
});

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: Object.values(TeamRole), default: TeamRole.MEMBER }
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [memberSchema], default: [] }
  },
  { timestamps: true }
);

teamSchema.index({ "members.userId": 1 });
teamSchema.index({ name: 1 });

export const Team = mongoose.model("Team", teamSchema);
