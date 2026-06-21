import mongoose, { Schema, Document } from "mongoose";

export type ReportStatus = "pending" | "approved" | "rejected";

export interface IAttachment {
  name: string;
  url: string;
  type: "image" | "file";
}

export interface IReport extends Document {
  taskId: mongoose.Types.ObjectId;
  taskTitle: string;
  memberId: mongoose.Types.ObjectId;
  memberName: string;
  summary: string;
  attachments: IAttachment[];
  status: ReportStatus;
  adminFeedback?: string;
  starsAwarded?: number;
  reviewedAt?: string;
  rejectionExplanation?: string;
  rejectionAttachments?: IAttachment[];
  rejectionCommentedAt?: string;
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "file"], required: true },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    taskTitle: { type: String, required: true },
    memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    memberName: { type: String, required: true },
    summary: { type: String, required: true },
    attachments: { type: [AttachmentSchema], default: [] },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminFeedback: { type: String },
    starsAwarded: { type: Number, min: 1, max: 5 },
    reviewedAt: { type: String },
    rejectionExplanation: { type: String },
    rejectionAttachments: { type: [AttachmentSchema], default: [] },
    rejectionCommentedAt: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IReport>("Report", ReportSchema);
