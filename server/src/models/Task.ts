import mongoose, { Schema, Document } from "mongoose";

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "progress" | "review" | "done" | "rejected";

export interface ITask extends Document {
  title: string;
  assigneeId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  timerDuration: number;
  timerRemaining: number;
  timerIsRunning: boolean;
  timerStartedAt?: string;
  weight: number;
  starsRating?: number;
  evaluatedAt?: string;
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    status: { type: String, enum: ["todo", "progress", "review", "done", "rejected"], default: "todo" },
    dueDate: { type: String, required: true },
    timerDuration: { type: Number, default: 3600 },
    timerRemaining: { type: Number, default: 3600 },
    timerIsRunning: { type: Boolean, default: false },
    timerStartedAt: { type: String },
    weight: { type: Number, default: 10 },
    starsRating: { type: Number, min: 1, max: 5 },
    evaluatedAt: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>("Task", TaskSchema);
