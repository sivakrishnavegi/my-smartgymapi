import { Schema, model } from "mongoose";
import { ISection } from "./types/section.types";

const SectionSchema = new Schema<ISection>({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
  name: { type: String, required: true },
  capacity: { type: Number },
  homeroomTeacherId: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export const SectionModel = model<ISection>("Section", SectionSchema);
