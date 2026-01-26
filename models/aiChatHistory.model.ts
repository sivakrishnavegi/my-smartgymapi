import { Schema, model, Document, Types } from "mongoose";

export interface IMessage {
    role: "user" | "assistant" | "system";
    content: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        cost?: number;
    };
    timestamp: Date;
}

export interface IAiChatHistory extends Document {
    tenantId: string;
    schoolId: Types.ObjectId;
    userId: Types.ObjectId;
    userRole: string; // "student", "teacher", etc.
    classId?: Types.ObjectId; // For students
    sectionId?: Types.ObjectId; // For students
    subjectId?: string; // Optional context
    topicId?: string; // Optional context

    sessionId: string; // Unique conversation ID (UUID)
    title?: string; // Auto-generated or user set
    messages: IMessage[];

    meta?: Record<string, any>;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    usage: {
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        totalTokens: { type: Number, default: 0 },
        cost: { type: Number, default: 0 },
    },
    timestamp: { type: Date, default: Date.now },
});

const AiChatHistorySchema = new Schema<IAiChatHistory>({
    tenantId: { type: String, required: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userRole: { type: String, required: true },

    classId: { type: Schema.Types.ObjectId, ref: "Class" },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
    subjectId: { type: String },
    topicId: { type: String },

    sessionId: { type: String, required: true, unique: true, index: true },
    title: { type: String },
    messages: [MessageSchema],
    meta: { type: Map, of: Schema.Types.Mixed },

    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Compound indexes for common query patterns
// 1. Get all chats for a student in a school
AiChatHistorySchema.index({ tenantId: 1, schoolId: 1, userId: 1, createdAt: -1 });

// 2. Get chats by Class/Section (e.g., Teacher reviewing queries)
AiChatHistorySchema.index({ tenantId: 1, schoolId: 1, classId: 1, sectionId: 1, createdAt: -1 });

export const AiChatHistoryModel = model<IAiChatHistory>("AiChatHistory", AiChatHistorySchema);
