import mongoose, { Schema, Document, Types } from 'mongoose';
import { ObjectId } from "mongodb";

export type UserType = "admin" | "teacher" | "student" | "librarian" | "guardian";
export type AccountStatus = "active" | "inactive" | "suspended";

export interface IContact {
  phone?: string;
  email?: string;
}

export interface IProfile {
  firstName?: string;
  lastName?: string;
  dob?: Date;
  gender?: string;
  photoUrl?: string;
  address?: string;
  contact?: IContact;
}

export interface IAccount {
  email?: string;
  username?: string;
  passwordHash?: string;
  status: AccountStatus;
}

export interface IEmployment {
  staffId?: string;
  deptId?: string;
  hireDate?: Date;
}

export interface IEnrollment {
  studentId?: string;
  classId?: Types.ObjectId;
  sectionId?: Types.ObjectId;
  rollNo?: string;
}

export interface IUser extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  userType: UserType;
  profile?: IProfile;
  account?: IAccount;
  roles: Types.ObjectId[];
  linkedStudentIds: Types.ObjectId[];  // only for guardian users
  employment?: IEmployment;            // only for staff (teacher/admin/librarian)
  enrollment?: IEnrollment;            // only for students
  createdAt: Date;
}

const UserSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: ObjectId, ref: 'School', required: true, index: true },
  userType: { type: String, enum: ['admin','teacher','student','librarian','guardian'], required: true },
  profile: {
    firstName: String,
    lastName: String,
    dob: Date,
    gender: String,
    photoUrl: String,
    address: String,
    contact: { phone: String, email: String }
  },
  account: {
    email: String,
    username: String,
    passwordHash: String,
    status: { type: String, enum: ['active','inactive','suspended'], default: 'active' }
  },
  roles: [{ type: ObjectId, ref: 'Role' }],
  linkedStudentIds: [{ type: ObjectId, ref: 'User' }], // for guardians
  employment: { staffId: String, deptId: String, hireDate: Date },
  enrollment: { studentId: String, classId: ObjectId, sectionId: ObjectId, rollNo: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('Users', UserSchema);
