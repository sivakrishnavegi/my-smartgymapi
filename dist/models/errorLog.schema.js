"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorLog = void 0;
const mongoose_1 = require("mongoose");
const errorLogSchema = new mongoose_1.Schema({
    tenantId: { type: String },
    userId: { type: mongoose_1.Types.ObjectId, ref: "User" },
    route: { type: String },
    method: { type: String },
    message: { type: String },
    stack: { type: String },
    metadata: { type: mongoose_1.Schema.Types.Mixed }, // For body, query, params, etc.
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });
exports.ErrorLog = (0, mongoose_1.model)("ErrorLog", errorLogSchema);
