"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendance = void 0;
const mongoose_1 = require("mongoose");
const studentAttendanceSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Types.ObjectId, ref: "Tenant", required: true },
    schoolId: { type: mongoose_1.Types.ObjectId, ref: "School", required: true },
    classId: { type: mongoose_1.Types.ObjectId, ref: "Class", required: true },
    sectionId: { type: mongoose_1.Types.ObjectId, ref: "Section", required: true },
    studentId: { type: mongoose_1.Types.ObjectId, ref: "Student", required: true },
    date: { type: Date, required: true },
    status: {
        type: String,
        enum: ["Present", "Absent", "Leave", "Late", "Half-Day"],
        default: "Present",
    },
    markedBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
    remarks: { type: String },
    session: { type: String }, // academic year, e.g. "2025-26"
}, { timestamps: true });
studentAttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
exports.Attendance = (0, mongoose_1.model)("StudentAttendance", studentAttendanceSchema);
