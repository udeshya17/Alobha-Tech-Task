import mongoose from "mongoose";

export const TaskStatus = Object.freeze({
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE"
});

export const TaskPriority = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH"
});

const taskSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.TODO, index: true },
    priority: { type: String, enum: Object.values(TaskPriority), default: TaskPriority.MEDIUM, index: true },
    dueDate: { type: Date, default: null, index: true },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null, index: true }
  },
  { timestamps: true }
);

taskSchema.index({ teamId: 1, deletedAt: 1, createdAt: -1 });
taskSchema.index({ title: "text", description: "text" });

export const Task = mongoose.model("Task", taskSchema);
