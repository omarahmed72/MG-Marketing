import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  name: string;
  channel: string;
  budget: number;
  spent: number;
  progress: number;
  leads: number;
  createdAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true },
    channel: { type: String, required: true },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    leads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICampaign>("Campaign", CampaignSchema);
