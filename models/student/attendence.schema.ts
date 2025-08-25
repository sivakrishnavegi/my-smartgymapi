import { Schema, model, Types } from "mongoose";

const studentAttendanceSchema = new Schema(
  {
    tenantId: { type: Types.ObjectId, ref: "Tenant", required: true },
    schoolId: { type: Types.ObjectId, ref: "School", required: true },
    classId: { type: Types.ObjectId, ref: "Class", required: true },
    sectionId: { type: Types.ObjectId, ref: "Section", required: true },
    studentId: { type: Types.ObjectId, ref: "Student", required: true },

    date: { type: Date, required: true }, // e.g., 2025-08-25
    status: {
      type: String,
      enum: ["Present", "Absent", "Leave", "Late", "Half-Day"],
      default: "Present",
    },

    markedBy: { type: Types.ObjectId, ref: "User" }, // Teacher/Admin
    remarks: { type: String },

    session: { type: String }, // academic year, e.g. "2025-26"
  },
  { timestamps: true }
);

studentAttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

export const Attendance = model("StudentAttendance", studentAttendanceSchema);
