import mongoose, { Schema, model, Types, Document } from "mongoose";

export interface ILeaveRequest extends Document {
    tenantId: string;
    schoolId: Types.ObjectId;
    classId: Types.ObjectId;
    sectionId: Types.ObjectId;
    studentId: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    leaveType: "Sick" | "Personal" | "Family" | "Other";
    reason: string;
    status: "Pending" | "Approved" | "Rejected";
    appliedBy: Types.ObjectId;
    role: string;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
    {
        tenantId: { type: String, required: true },
        schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
        classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
        sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
        studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },

        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        leaveType: {
            type: String,
            enum: ["Sick", "Personal", "Family", "Other"],
            required: true,
        },
        reason: { type: String, required: true },

        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending",
        },

        appliedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, required: true }, // e.g., "Student", "Parent", "Teacher"

        reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reviewedAt: { type: Date },
        remarks: { type: String },
    },
    { timestamps: true }
);

// Index for multi-tenant and class-based scoping
leaveRequestSchema.index({ tenantId: 1, schoolId: 1, classId: 1, sectionId: 1, status: 1 });
leaveRequestSchema.index({ studentId: 1, status: 1 });

export const LeaveRequest = model<ILeaveRequest>("LeaveRequest", leaveRequestSchema);
