import mongoose, { Schema, Document } from "mongoose";

export interface IMedia extends Document {
    fileName: string;
    originalName: string;
    s3Key: string;
    mimetype: string;
    size: number;
    tenantId: string;
    schoolId: string;
    uploadedBy: mongoose.Types.ObjectId;
    purpose: string;
    createdAt: Date;
    updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
    {
        fileName: { type: String, required: true },
        originalName: { type: String, required: true },
        s3Key: { type: String, required: true, index: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true },
        tenantId: { type: String, required: true, index: true },
        schoolId: { type: String, required: true, index: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        purpose: { type: String, default: "general" },
    },
    { timestamps: true }
);

export default mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);
