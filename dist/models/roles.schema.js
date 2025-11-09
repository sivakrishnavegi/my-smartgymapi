"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleModel = void 0;
const mongoose_1 = require("mongoose");
const RoleSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    schoolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "School", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    permissions: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
});
exports.RoleModel = (0, mongoose_1.model)("Role", RoleSchema);
