import { Schema, model, Types } from "mongoose";

const errorLogSchema = new Schema(
    {
        tenantId: { type: String },
        userId: { type: Types.ObjectId, ref: "User" },
        route: { type: String },
        method: { type: String },
        message: { type: String },
        stack: { type: String },
        metadata: { type: Schema.Types.Mixed }, // For body, query, params, etc.
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const ErrorLog = model("ErrorLog", errorLogSchema);
