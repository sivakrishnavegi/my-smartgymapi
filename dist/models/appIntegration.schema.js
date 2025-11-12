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
const GoogleIntegrationSchema = new mongoose_1.Schema({
    enabled: { type: Boolean, default: false },
    signInAuth: {
        status: { type: String, enum: ["granted", "not-granted"], default: "not-granted" },
        clientId: String,
        clientSecret: String,
    },
    calendar: {
        status: { type: String, enum: ["granted", "not-granted"], default: "not-granted" },
        apiKey: String,
    },
    meet: {
        status: { type: String, enum: ["granted", "not-granted"], default: "not-granted" },
        apiKey: String,
    },
    events: {
        status: { type: String, enum: ["granted", "not-granted"], default: "not-granted" },
    },
});
const AwsIntegrationSchema = new mongoose_1.Schema({
    enabled: { type: Boolean, default: false },
    accessKeyId: String,
    secretAccessKey: String,
    region: String,
    bucket: String,
});
const AppIntegrationSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    provider: { type: String, enum: ["google", "aws", "azure", "other"], required: true },
    google: GoogleIntegrationSchema,
    aws: AwsIntegrationSchema,
}, { timestamps: true });
exports.default = mongoose_1.default.model("AppIntegration", AppIntegrationSchema);
