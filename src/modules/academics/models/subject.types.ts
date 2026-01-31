import { Document, Types } from "mongoose";

export interface ISubject extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId; // Section Specific
  name: string;
  code: string;
  creditHours?: number;  // optional
  createdAt: Date;
}
