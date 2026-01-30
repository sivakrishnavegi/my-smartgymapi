import { Schema, model, Document, Types } from "mongoose";

export interface IAiDocument extends Document {
    tenantId: string;
    schoolId: Types.ObjectId;
    classId?: Types.ObjectId;
    sectionId?: Types.ObjectId;

    fileName: string;
    originalName: string;
    s3Key: string;
    fileType: string;
    fileSize: number;
    content?: string; // Extracted text content from RAG service

    status: "processing" | "indexed" | "failed";
    vectorIds: string[]; // Reference to IDs in Vector DB
    ragDocumentId?: string; // Reference to document in RAG Microservice
    contentHash?: string; // SHA-256 hash of the content for deduplication

    metadata: {
        category?: string;
        tags?: string[];
        uploadedBy: Types.ObjectId;
    };

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AiDocumentSchema = new Schema<IAiDocument>(
    {
        tenantId: { type: String, required: true, index: true },
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: "School",
            required: true,
            index: true,
        },
        classId: { type: Schema.Types.ObjectId, ref: "Class", index: true },
        sectionId: { type: Schema.Types.ObjectId, ref: "Section", index: true },

        fileName: { type: String, required: true },
        originalName: { type: String, required: true },
        s3Key: { type: String, required: true, unique: true },
        fileType: { type: String },
        fileSize: { type: Number },
        content: { type: String },

        status: {
            type: String,
            enum: ["processing", "indexed", "failed"],
            default: "processing",
        },
        vectorIds: [{ type: String }],
        ragDocumentId: { type: String, index: true },
        contentHash: { type: String, index: true },

        metadata: {
            category: { type: String },
            tags: [{ type: String }],
            uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        },

        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Index for multi-tenant retrieval
AiDocumentSchema.index({ tenantId: 1, schoolId: 1, classId: 1, sectionId: 1 });

export const AiDocumentModel = model<IAiDocument>(
    "AiDocument",
    AiDocumentSchema
);
