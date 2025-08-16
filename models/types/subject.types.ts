import { Document, Types } from "mongoose";

export interface ISubject extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  name: string;
  code: string;
  creditHours?: number;  // optional
  createdAt: Date;
}
