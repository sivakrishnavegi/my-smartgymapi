"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassModel = void 0;
const mongoose_1 = require("mongoose");
const ClassSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    schoolId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "School",
        required: true,
        index: true,
    },
    name: { type: String, required: true },
    code: { type: String, unique: true },
    description: { type: String },
    academicSession: { type: String },
    medium: { type: String },
    shift: { type: String, enum: ["Morning", "Evening"] },
    sections: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Section" }],
    classTeacher: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
});
exports.ClassModel = (0, mongoose_1.model)("Class", ClassSchema);
