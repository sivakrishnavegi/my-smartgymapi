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
const DepartmentSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    type: {
        type: String,
        enum: ["academic", "administrative"],
        default: "academic",
    },
    description: { type: String },
    head: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    staff: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    students: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    establishedYear: { type: Number },
    contactEmail: { type: String, lowercase: true },
    contactPhone: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
exports.default = mongoose_1.default.models.Department ||
    mongoose_1.default.model("Department", DepartmentSchema);
