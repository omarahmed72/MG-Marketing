import mongoose, { Schema, Document } from "mongoose";

export interface ISpecialty extends Document {
  name: string;
  description: string;
  createdAt: Date;
}

const SpecialtySchema = new Schema<ISpecialty>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<ISpecialty>("Specialty", SpecialtySchema);
