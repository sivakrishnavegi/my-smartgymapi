"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const mongoose_1 = __importStar(require("mongoose"));
const counter_schema_1 = __importDefault(require("./counter.schema"));
const UserSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true },
    schoolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "School", required: true },
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
        },
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
    roles: [{ type: mongodb_1.ObjectId, ref: "Role" }],
    linkedStudentIds: [{ type: mongodb_1.ObjectId, ref: "User" }],
    employment: { staffId: String, deptId: String, hireDate: Date },
    enrollment: {
        studentId: String,
        classId: mongodb_1.ObjectId,
        sectionId: mongodb_1.ObjectId,
        regNo: String,
    },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongodb_1.ObjectId, ref: "User" }
});
// ------------------ Pre-save Hook ------------------
UserSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        // Ensure account exists
        user.account = user.account || { status: "active" };
        // Normalize email
        if (!user.account.primaryEmail ||
            user.account.primaryEmail.toLowerCase().trim() === "") {
            delete user.account.primaryEmail; // remove undefined, null, or empty string
        }
        else {
            user.account.primaryEmail = user.account.primaryEmail.toLowerCase().trim();
        }
        // Only generate regNo for students who don't have it yet
        if (user.userType === "student") {
            user.enrollment = user.enrollment || {};
            if (!user.enrollment.regNo) {
                const counter = yield counter_schema_1.default.findByIdAndUpdate("regNo", { $inc: { seq: 1 } }, { new: true, upsert: true });
                user.enrollment.regNo = counter.seq.toString();
            }
        }
        next();
    });
});
// Ensure correct index
UserSchema.index({ "account.primaryEmail": 1 }, { unique: true, sparse: true });
const UserModel = mongoose_1.default.model("Users", UserSchema);
// Sync indexes on startup
UserModel.syncIndexes().then(() => {
    console.log("✅ User indexes synced");
});
exports.default = UserModel;
