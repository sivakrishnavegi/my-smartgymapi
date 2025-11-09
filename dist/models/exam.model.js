"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamModel = void 0;
const mongoose_1 = require("mongoose");
const ExamSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    schoolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: String, required: true },
    title: { type: String, required: true },
    examType: { type: String, enum: ["term", "mid", "final"], required: true },
    description: { type: String },
    // Classes taking the exam
    classes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Class", required: true }],
    // Exam schedule per subject
    schedule: [
        {
            subjectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Subject", required: true },
            date: { type: Date, required: true },
            startTime: { type: String, required: true },
            duration: { type: Number, required: true }, // in minutes
        },
    ],
    // Status: Scheduled, Ongoing, Completed
    status: { type: String, enum: ["Scheduled", "Ongoing", "Completed"], default: "Scheduled" },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: true, // automatically adds createdAt and updatedAt
});
exports.ExamModel = (0, mongoose_1.model)("Exam", ExamSchema);
