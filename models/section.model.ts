import { Schema, model } from "mongoose";
import { ISection } from "./types/section.types";

const SectionSchema = new Schema<ISection>({
  tenantId: { type: String, required: true, index: true },
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
  },
  isActive: { type: Boolean, default: false },
  sectionName: { type: String, required: true },
  sectionCode: { type: String },
  description: { type: String },
  homeroomTeacherId: { type: Schema.Types.ObjectId, ref: "User" },
  subjects: [{
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User" }
  }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

export const SectionModel = model<ISection>("Section", SectionSchema);
