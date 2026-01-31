import { Schema, model } from "mongoose";
import { IResult } from "./result.types";

const ResultSchema = new Schema<IResult>({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
  marksObtained: { type: Number, required: true },
  grade: { type: String },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const ResultModel = model<IResult>("Result", ResultSchema);
