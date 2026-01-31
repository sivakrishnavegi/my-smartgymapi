import { Schema, model, Document, Types } from "mongoose";

export interface IAiSubjectConfig extends Document {
    tenantId: string;
    schoolId: Types.ObjectId;
    subjectId: Types.ObjectId;
    isActive: boolean;
    enabledClasses: Types.ObjectId[];
    ragStats: {
        totalChunks: number;
        lastSync: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

const AiSubjectConfigSchema = new Schema<IAiSubjectConfig>(
    {
        tenantId: { type: String, required: true, index: true },
        schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true, unique: true, index: true },
        isActive: { type: Boolean, default: false },
        enabledClasses: [{ type: Schema.Types.ObjectId, ref: "Class" }],
        ragStats: {
            totalChunks: { type: Number, default: 0 },
            lastSync: { type: Date },
        },
    },
    { timestamps: true }
);

export const AiSubjectConfigModel = model<IAiSubjectConfig>("AiSubjectConfig", AiSubjectConfigSchema);
