import { Document, Types } from "mongoose";

export interface IClass extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  name: string;   // e.g., "Grade 10"
  code: string;
  createdAt: Date;
}
