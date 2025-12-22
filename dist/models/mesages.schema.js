"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MessageSchema = new mongoose_1.default.Schema({
    roomId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "ChatRoom",
        required: true,
        index: true,
    },
    senderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    messageType: {
        type: String,
        enum: ["text", "image", "file", "system"],
        default: "text",
    },
    text: {
        type: String,
        trim: true,
        maxlength: 5000,
    },
    attachments: [
        {
            url: { type: String },
            fileName: { type: String },
            fileSize: { type: Number },
            fileType: { type: String },
        },
    ],
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
        index: true,
    },
    readBy: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    deletedFor: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    isDeleted: {
        type: Boolean,
        default: false,
    },
    meta: {
        ipAddress: { type: String },
        userAgent: { type: String },
    },
}, {
    timestamps: true,
});
MessageSchema.index({ roomId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ status: 1 });
exports.Message = mongoose_1.default.model("Message", MessageSchema);
