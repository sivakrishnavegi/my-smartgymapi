"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const mongodb_1 = require("mongodb");
const TenantSchema = new mongoose_1.Schema({
    tenantId: {
        type: String,
        unique: true,
        default: uuid_1.v4,
        index: true,
    },
    name: String,
    domain: String,
    apiKeys: [
        {
            keyHash: String,
            keySecret: String,
            issuedAt: Date,
            issuedBy: { type: mongodb_1.ObjectId, ref: "User" },
            revoked: { type: Boolean, default: false },
        },
    ],
    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    subscription: {
        startDate: Date,
        endDate: Date,
        status: {
            type: String,
            enum: ["active", "expired", "grace"],
            default: "active",
        },
        maxUsers: Number,
        maxStudents: Number,
    },
    isSassSetupCompleted: { type: Boolean, default: false },
    isApiKeysVerified: { type: Boolean, default: false },
    isSchoolSetupCompleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
});
exports.default = mongoose_1.default.model("Tenant", TenantSchema);
