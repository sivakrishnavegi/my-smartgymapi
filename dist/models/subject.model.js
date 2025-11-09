"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectModel = void 0;
const mongoose_1 = require("mongoose");
const SubjectSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    schoolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "School", required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    creditHours: { type: Number },
    createdAt: { type: Date, default: Date.now },
});
exports.SubjectModel = (0, mongoose_1.model)("Subject", SubjectSchema);
