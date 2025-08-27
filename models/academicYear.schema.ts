import mongoose, { Schema, Document } from "mongoose";

export interface IAcademicYear extends Document {
  title: string; // e.g., "2024-2025"
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicYearSchema = new Schema<IAcademicYear>(
  {
    title: { type: String, required: true, unique: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.AcademicYear ||
  mongoose.model<IAcademicYear>("AcademicYear", AcademicYearSchema);
