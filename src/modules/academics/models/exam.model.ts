import { Schema, model, Types } from "mongoose";
import { IExam } from "./types/exam.types";

const ExamSchema = new Schema<IExam>(
  {
    tenantId: { type: String, required: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: String, required: true },

    title: { type: String, required: true },
    examType: { type: String, enum: ["term", "mid", "final"], required: true },
    description: { type: String },

    // Classes taking the exam
    classes: [{ type: Schema.Types.ObjectId, ref: "Class", required: true }],

    // Exam schedule per subject
    schedule: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        duration: { type: Number, required: true }, // in minutes
      },
    ],

    // Status: Scheduled, Ongoing, Completed
    status: { type: String, enum: ["Scheduled", "Ongoing", "Completed"], default: "Scheduled" },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

export const ExamModel = model<IExam>("Exam", ExamSchema);
