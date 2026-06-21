import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "admin" | "member";
export type UserStatus = "active" | "pending";

export interface IUser extends Document {
  name: string;
  email: string;
  googleId: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  specialty: string;
  workload: number;
  overallRating?: number;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, required: true, unique: true },
    photoURL: { type: String },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    status: { type: String, enum: ["active", "pending"], default: "pending" },
    specialty: { type: String, default: "غير محدد" },
    workload: { type: Number, default: 0 },
    overallRating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
