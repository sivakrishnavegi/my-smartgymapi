import { Schema, model, Types, Document } from "mongoose";

export interface IAiLog extends Document {
    requestId: string;
    tenantId?: string;
    userId?: Types.ObjectId;
    route: string;
    from: string;
    to: string;
    method: string;
    payload: any;
    response?: any;
    error?: string;
    statusCode?: number;
    latency: number;
    timestamp: Date;
}

const aiLogSchema = new Schema<IAiLog>(
    {
        requestId: { type: String, required: true, index: true },
        tenantId: { type: String, index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        route: { type: String },
        from: { type: String, default: "gym-api" },
        to: { type: String },
        method: { type: String },
        payload: { type: Schema.Types.Mixed },
        response: { type: Schema.Types.Mixed },
        error: { type: String },
        statusCode: { type: Number },
        latency: { type: Number }, // in milliseconds
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const AiLog = model<IAiLog>("AiLog", aiLogSchema);
