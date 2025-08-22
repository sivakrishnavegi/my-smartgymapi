import mongoose, { Schema, Document, Types } from "mongoose";
import { ObjectId } from "mongodb";
import Counter from "./counter.schema";

export interface IGoogleAuth {
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number; // usually epoch timestamp (ms or s)
  idToken?: string;
  tokenType?: string;
  scope?: string;
}

export type UserType =
  | "admin"
  | "superadmin"
  | "guest"
  | "teacher"
  | "student"
  | "librarian"
  | "guardian";
export type AccountStatus = "active" | "inactive" | "suspended";

export interface IContact {
  secondaryContact?: string;
  secondaryEmail?: string;
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
  primaryEmail?: string;
  username?: string;
  passwordHash?: string;
  status: AccountStatus;
  google?: IGoogleAuth;
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

export type IntegrationPermissionStatus = "granted" | "not-granted";

export interface IIntegrationPermissions {
  googleSignInAuth: IntegrationPermissionStatus;
  googleCalender: IntegrationPermissionStatus;
  googleMeet: IntegrationPermissionStatus;
}
export interface IUser extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  userType: UserType;
  profile?: IProfile;
  account?: IAccount;
  roles: Types.ObjectId[];
  linkedStudentIds: Types.ObjectId[];
  integrationPermissions?: IIntegrationPermissions;
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
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  userType: {
    type: String,
    enum: [
      "admin",
      "teacher",
      "student",
      "librarian",
      "guardian",
      "guest",
      "superadmin",
    ],
    required: true,
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
    primaryEmail: {
      type: String,
    }, // sparse allows null
    username: String,
    passwordHash: String,
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "inactive",
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
  integrationPermissions: {
    googleSignInAuth: { type: String, enum: ["granted", "not-granted"] },
    googleCalender: { type: String, enum: ["granted", "not-granted"] },
    googleMeet: { type: String, enum: ["granted", "not-granted"] },
  },
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
  if (
    !user.account.primaryEmail ||
    user.account.primaryEmail.toLowerCase().trim() === ""
  ) {
    delete user.account.primaryEmail; // remove undefined, null, or empty string
  } else {
    user.account.primaryEmail = user.account.primaryEmail.toLowerCase().trim();
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

// Ensure correct index
UserSchema.index(
  { "account.primaryEmail": 1 },
  { unique: true, sparse: true }
);

const UserModel = mongoose.model<IUser>("Users", UserSchema);

// Sync indexes on startup
UserModel.syncIndexes().then(() => {
  console.log("✅ User indexes synced");
});

export default UserModel

