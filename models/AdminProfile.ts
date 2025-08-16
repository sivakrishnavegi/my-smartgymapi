import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAdminProfile extends Document {
  userId: Types.ObjectId;   // reference to Users
  staffId: string;
  deptId: Types.ObjectId;
  hireDate: Date;
  designation: string; // e.g., Principal, Vice-Principal
}

const AdminProfileSchema = new Schema<IAdminProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "Users", required: true, unique: true },
  staffId: { type: String, required: true },
  deptId: { type: Schema.Types.ObjectId, ref: "Department" },
  hireDate: Date,
  designation: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IAdminProfile>("AdminProfile", AdminProfileSchema);
