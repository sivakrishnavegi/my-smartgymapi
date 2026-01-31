import { Document, Types } from "mongoose";

export interface IExamSchedule {
  subjectId: Types.ObjectId;
  date: Date;
  startTime: string;  // e.g. "09:00"
  duration: number;   // in minutes
}

export interface IExam extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  academicYearId: string;
  title: string;
  examType: "term" | "mid" | "final";
  description?: string;
  
  // Classes linked to the exam
  classes: Types.ObjectId[];

  // Exam schedule per subject
  schedule: IExamSchedule[];

  // Status of the exam
  status: "Scheduled" | "Ongoing" | "Completed";

  // Tracking who created or updated the exam
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}
