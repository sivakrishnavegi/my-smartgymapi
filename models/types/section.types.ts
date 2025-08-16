import { Document, Types } from "mongoose";

export interface ISection extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  name: string;               // e.g., "A"
  capacity?: number;          // optional
  homeroomTeacherId?: Types.ObjectId;
  createdAt: Date;
}
