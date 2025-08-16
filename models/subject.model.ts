import { Schema, model } from "mongoose";
import { ISubject } from "./types/subject.types";

const SubjectSchema = new Schema<ISubject>({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  creditHours: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

export const SubjectModel = model<ISubject>("Subject", SubjectSchema);
