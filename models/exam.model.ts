import { Schema, model } from "mongoose";
import { IExam } from "./types/exam.types";

const ExamSchema = new Schema<IExam>({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  academicYearId: { type: String, required: true },
  title: { type: String, required: true },
  examType: { type: String, enum: ["term", "mid", "final"], required: true },
  schedule: [
    {
      subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
      date: { type: Date, required: true },
      startTime: { type: String, required: true },
      duration: { type: Number, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export const ExamModel = model<IExam>("Exam", ExamSchema);
