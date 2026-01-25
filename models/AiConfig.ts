import { Schema, model, Document, Types } from "mongoose";

export interface IAiConfig extends Document {
    tenantId: string;
    schoolId: Types.ObjectId;
    isEnabled: boolean;
    subscription: {
        tier: "free" | "basic" | "premium";
        expiresAt?: Date;
    };
    tokenManagement: {
        monthlyLimit: number;
        usedThisMonth: number;
        totalUsed: number;
        lastResetDate: Date;
    };
    config: {
        modelVendor: string; // e.g., "openai", "anthropic"
        defaultModel: string;
        temperature: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const AiConfigSchema = new Schema<IAiConfig>(
    {
        tenantId: { type: String, required: true, index: true },
        schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, unique: true, index: true },
        isEnabled: { type: Boolean, default: false },
        subscription: {
            tier: { type: String, enum: ["free", "basic", "premium"], default: "free" },
            expiresAt: { type: Date },
        },
        tokenManagement: {
            monthlyLimit: { type: Number, default: 100000 }, // Default 100k tokens
            usedThisMonth: { type: Number, default: 0 },
            totalUsed: { type: Number, default: 0 },
            lastResetDate: { type: Date, default: Date.now },
        },
        config: {
            modelVendor: { type: String, default: "openai" },
            defaultModel: { type: String, default: "gpt-4o-mini" },
            temperature: { type: Number, default: 0.7 },
        },
    },
    { timestamps: true }
);

// Compound index for tenant+school lookups
AiConfigSchema.index({ tenantId: 1, schoolId: 1 });

export const AiConfigModel = model<IAiConfig>("AiConfig", AiConfigSchema);
