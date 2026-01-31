import { Document, Types } from "mongoose";

export interface IResult extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  marksObtained: number;
  grade?: string;
  remarks?: string;
  createdAt: Date;
}
