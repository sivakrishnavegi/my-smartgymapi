import { Document, Types } from "mongoose";

export interface IExamSchedule {
  subjectId: Types.ObjectId;
  date: Date;
  startTime: string;  // e.g. "09:00"
  duration: number;   // minutes
}

export interface IExam extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  academicYearId: string;
  title: string;
  examType: "term" | "mid" | "final";
  schedule: IExamSchedule[];
  createdAt: Date;
}
