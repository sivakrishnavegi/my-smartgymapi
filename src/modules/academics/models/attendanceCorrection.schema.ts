import { Schema, model, Types } from "mongoose";

const attendanceCorrectionSchema = new Schema(
    {
        tenantId: { type: String, required: true },
        schoolId: { type: Types.ObjectId, ref: "School", required: true },
        classId: { type: Types.ObjectId, ref: "Class", required: true },
        sectionId: { type: Types.ObjectId, ref: "Section", required: true },
        studentId: { type: Types.ObjectId, ref: "Student", required: true },
        attendanceId: { type: Types.ObjectId, ref: "StudentAttendance", required: true },
        attendanceDate: { type: Date, required: true },

        currentStatus: {
            type: String,
            enum: ["Present", "Absent", "Late", "Excuse"],
            required: true,
        },
        requestedStatus: {
            type: String,
            enum: ["Present", "Absent", "Late", "Excuse"],
            required: true,
        },
        reason: { type: String, required: true },

        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending",
        },

        requestedBy: { type: Types.ObjectId, ref: "User", required: true },
        role: { type: String, required: true }, // e.g., "Student" or "Parent"

        reviewedBy: { type: Types.ObjectId, ref: "User" },
        reviewedAt: { type: Date },
        adminRemarks: { type: String },
    },
    { timestamps: true }
);

// Index for faster queries for teachers
attendanceCorrectionSchema.index({ tenantId: 1, schoolId: 1, classId: 1, sectionId: 1, status: 1 });
attendanceCorrectionSchema.index({ studentId: 1, status: 1 });

export const AttendanceCorrection = model("AttendanceCorrectionRequest", attendanceCorrectionSchema);
