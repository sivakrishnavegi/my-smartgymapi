"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendance = void 0;
const mongoose_1 = require("mongoose");
const studentAttendanceSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true },
    schoolId: { type: mongoose_1.Types.ObjectId, ref: "School", required: true },
    classId: { type: mongoose_1.Types.ObjectId, ref: "Class", required: true },
    sectionId: { type: mongoose_1.Types.ObjectId, ref: "Section", required: true },
    studentId: { type: mongoose_1.Types.ObjectId, ref: "Student", required: true },
    date: { type: Date, required: true }, // e.g., 2025-08-25
    status: {
        type: String,
        enum: ["Present", "Absent", "Late", "Excuse"],
        default: "Present",
    },
    markedBy: {
        user: { type: mongoose_1.Types.ObjectId, ref: "User" },
        role: { type: String },
        at: { type: Date, default: Date.now },
    },
    updatedBy: {
        user: { type: mongoose_1.Types.ObjectId, ref: "User" },
        role: { type: String },
        at: { type: Date },
    },
    remarks: { type: String },
    session: { type: String }, // academic year, e.g. "2025-26"
}, { timestamps: true });
studentAttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
exports.Attendance = (0, mongoose_1.model)("StudentAttendance", studentAttendanceSchema);
