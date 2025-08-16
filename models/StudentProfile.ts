import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudentProfile extends Document {
  userId: Types.ObjectId;   // reference to Users
  admissionDate: Date;
  regNo: string;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  guardianId?: Types.ObjectId; // linked guardian
  bloodGroup?: string;
  emergencyContact?: string;
  transportation?: {
    busRoute?: string;
    pickupPoint?: string;
  };
}

const StudentProfileSchema = new Schema<IStudentProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "Users", required: true, unique: true },
  admissionDate: Date,
  regNo: String,
  classId: { type: Schema.Types.ObjectId, ref: "Class" },
  sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
  guardianId: { type: Schema.Types.ObjectId, ref: "Users" },
  bloodGroup: String,
  emergencyContact: String,
  transportation: {
    busRoute: String,
    pickupPoint: String,
  }
}, { timestamps: true });

export default mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);
