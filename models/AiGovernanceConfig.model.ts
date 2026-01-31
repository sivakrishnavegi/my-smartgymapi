import { Schema, model, Document, Types } from "mongoose";

export interface ITeachingStyle {
    id: string;
    name: string;
    prompt: string;
    isDefault: boolean;
}

export interface IAiGovernanceConfig extends Document {
    tenantId: string;
    schoolId: Types.ObjectId;
    globalSystemPrompt: string;
    teachingStyles: ITeachingStyle[];
    safetyGuardrails: {
        forbiddenKeywords: string[];
        sensitiveTopics: string[];
        strictMode: boolean;
    };
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

const TeachingStyleSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    prompt: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
}, { _id: false });

const AiGovernanceConfigSchema = new Schema<IAiGovernanceConfig>(
    {
        tenantId: { type: String, required: true, index: true },
        schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true, unique: true },

        globalSystemPrompt: {
            type: String,
            default: "You are a helpful AI assistant for students and teachers."
        },

        teachingStyles: {
            type: [TeachingStyleSchema],
            default: [
                {
                    id: "socratic",
                    name: "Socratic Method",
                    prompt: "Do not give the answer directly. Ask guiding questions to help the student find the answer.",
                    isDefault: true
                },
                {
                    id: "direct",
                    name: "Direct Instruction",
                    prompt: "Explain concepts clearly and directly with examples...",
                    isDefault: false
                },
                {
                    id: "eli5",
                    name: "ELI5",
                    prompt: "Explain like I am 5 years old. Use simple analogies.",
                    isDefault: false
                }
            ]
        },

        safetyGuardrails: {
            forbiddenKeywords: [{ type: String }],
            sensitiveTopics: [{ type: String }],
            strictMode: { type: Boolean, default: true }
        },

        version: { type: Number, default: 1 }
    },
    { timestamps: true }
);

export const AiGovernanceConfigModel = model<IAiGovernanceConfig>(
    "AiGovernanceConfig",
    AiGovernanceConfigSchema
);
