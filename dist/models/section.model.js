"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectionModel = void 0;
const mongoose_1 = require("mongoose");
const SectionSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    schoolId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "School",
        required: true,
        index: true,
    },
    isActive: { type: Boolean, default: false },
    sectionName: { type: String, required: true },
    sectionCode: { type: String },
    description: { type: String },
    homeroomTeacherId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }
});
exports.SectionModel = (0, mongoose_1.model)("Section", SectionSchema);
