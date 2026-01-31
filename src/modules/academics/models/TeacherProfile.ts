import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeacherProfile extends Document {
  userId: Types.ObjectId;   // reference to Users
  staffId: string;
  deptId: Types.ObjectId;
  hireDate: Date;
  qualifications?: string[];
  specialization?: string[];
  subjects?: Types.ObjectId[]; // subjects taught
}

const TeacherProfileSchema = new Schema<ITeacherProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  staffId: { type: String, required: true },
  deptId: { type: Schema.Types.ObjectId, ref: "Department" },
  hireDate: Date,
  qualifications: [String],
  specialization: [String],
  subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }]
}, { timestamps: true });

export default mongoose.model<ITeacherProfile>("TeacherProfile", TeacherProfileSchema);
