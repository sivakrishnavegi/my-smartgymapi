"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultModel = void 0;
const mongoose_1 = require("mongoose");
const ResultSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    schoolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "School", required: true, index: true },
    examId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    marksObtained: { type: Number, required: true },
    grade: { type: String },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now },
});
exports.ResultModel = (0, mongoose_1.model)("Result", ResultSchema);
