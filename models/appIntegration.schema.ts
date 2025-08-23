import mongoose, { Schema, Document } from "mongoose";

export type IntegrationProvider = "google" | "aws" | "azure" | "other";

export interface IGoogleIntegration {
  enabled: boolean;
  signInAuth?: {
    status: "granted" | "not-granted";
    clientId?: string;
    clientSecret?: string;
  };
  calendar?: {
    status: "granted" | "not-granted";
    apiKey?: string;
  };
  meet?: {
    status: "granted" | "not-granted";
    apiKey?: string;
  };
  events?: {
    status: "granted" | "not-granted";
  };
}

export interface IAwsIntegration {
  enabled: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  bucket?: string;
}

export interface IAppIntegration extends Document {
  tenantId: string;
  provider: IntegrationProvider;
  google?: IGoogleIntegration;
  aws?: IAwsIntegration;
  createdAt: Date;
  updatedAt: Date;
}

const GoogleIntegrationSchema = new Schema<IGoogleIntegration>({
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

const AwsIntegrationSchema = new Schema<IAwsIntegration>({
  enabled: { type: Boolean, default: false },
  accessKeyId: String,
  secretAccessKey: String,
  region: String,
  bucket: String,
});

const AppIntegrationSchema = new Schema<IAppIntegration>(
  {
    tenantId: { type: String, required: true, index: true },
    provider: { type: String, enum: ["google", "aws", "azure", "other"], required: true },
    google: GoogleIntegrationSchema,
    aws: AwsIntegrationSchema,
  },
  { timestamps: true }
);

export default mongoose.model<IAppIntegration>("AppIntegration", AppIntegrationSchema);
