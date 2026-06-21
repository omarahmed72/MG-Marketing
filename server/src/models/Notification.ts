import mongoose, { Schema, Document } from "mongoose";

export type NotificationType = "tasks" | "team" | "review" | "rating" | "registration";

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["tasks", "team", "review", "rating", "registration"], required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>("Notification", NotificationSchema);
