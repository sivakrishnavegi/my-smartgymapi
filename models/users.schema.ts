import mongoose, { Schema, Document, Types } from "mongoose";
import { ObjectId } from "mongodb";
import Counter from "./counter.schema";

export type UserType =
  | "admin"
  | "guest"
  | "teacher"
  | "student"
  | "librarian"
  | "guardian";
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
  regNo?: string;
}

export interface IUser extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  userType: UserType;
  profile?: IProfile;
  account?: IAccount;
  roles: Types.ObjectId[];
  linkedStudentIds: Types.ObjectId[];
  employment?: IEmployment;
  enrollment?: IEnrollment;
  createdAt: Date;
}
export interface IAuthProvider {
  provider: "local" | "google";
  providerId?: string; // google sub id
}

export interface IUser extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  userType: UserType;
  profile?: IProfile;
  account?: IAccount;
  providers: IAuthProvider[]; // 👈 multiple login providers
  roles: Types.ObjectId[];
  linkedStudentIds: Types.ObjectId[];
  employment?: IEmployment;
  enrollment?: IEnrollment;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  tenantId: { type: String, required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School" },
  userType: {
    type: String,
    enum: ["admin", "teacher", "student", "librarian", "guardian", "guest"],
  },
  profile: {
    firstName: String,
    lastName: String,
    dob: Date,
    gender: String,
    photoUrl: String,
    address: String,
    contact: { phone: String, email: String },
  },
  account: {
    email: { type: String, lowercase: true, trim: true },
    username: String,
    passwordHash: String,
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    google: {
      accessToken: { type: String },
      refreshToken: { type: String },
      expiryDate: { type: Number },
      idToken: { type: String },
      tokenType: { type: String },
      scope: { type: String },
    },
  },
  providers: [
    {
      provider: { type: String, enum: ["local", "google"] },
      providerId: String,
    },
  ],
  roles: [{ type: ObjectId, ref: "Role" }],
  linkedStudentIds: [{ type: ObjectId, ref: "User" }],
  employment: { staffId: String, deptId: String, hireDate: Date },
  enrollment: {
    studentId: String,
    classId: ObjectId,
    sectionId: ObjectId,
    regNo: String,
  },
  createdAt: { type: Date, default: Date.now },
});

// ------------------ Pre-save Hook ------------------
UserSchema.pre<IUser>("save", async function (next) {
  const user = this;

  // Ensure account exists
  user.account = user.account || { status: "active" };

  // Normalize email
  if (!user.account.email || user.account.email.trim() === "") {
    delete user.account.email; // remove undefined, null, or empty string
  } else {
    user.account.email = user.account.email.toLowerCase().trim();
  }

  // Only generate regNo for students who don't have it yet
  if (user.userType === "student") {
    user.enrollment = user.enrollment || {};
    if (!user.enrollment.regNo) {
      const counter = await Counter.findByIdAndUpdate(
        "regNo",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      user.enrollment.regNo = counter.seq.toString();
    }
  }

  next();
});

// ------------------ Indexes ------------------
// Unique, but only for documents that have an email
// UserSchema.index({ "account.email": 1 }, { unique: true, sparse: true });

export default mongoose.model<IUser>("Users", UserSchema);
