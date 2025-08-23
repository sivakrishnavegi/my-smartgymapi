import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from "uuid";
import { ObjectId } from "mongodb";

import { Document } from "mongoose";

export interface IApiKey {
  keyHash: string;
  issuedAt: Date;
  keySecret : string;
  revoked: boolean;
  issuedBy : string;
}

export interface ISubscription {
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "grace";
  maxUsers: number;
  maxStudents: number;
}

export interface ITenant extends Document {
  tenantId: string;
  name?: string;
  domain?: string;
  apiKeys: IApiKey[];
  plan: "free" | "pro" | "enterprise";
  subscription: ISubscription;
  createdAt: Date;
  updatedAt?: Date;
}


const TenantSchema = new Schema({
  tenantId: {
      type: String,
      unique: true,
      default: uuidv4, 
      index: true
    },
  name: String,
  domain: String,
  apiKeys: [{
    keyHash: String,
    keySecret : String,
    issuedAt: Date,
    issuedBy :{ type: ObjectId, ref: "User" } ,
    revoked: { type: Boolean, default: false }
  }],
  plan: { type: String, enum: ['free','pro','enterprise'], default: 'free' },
  subscription: {
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['active','expired','grace'], default: 'active' },
    maxUsers: Number,
    maxStudents: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

export default mongoose.model<ITenant>('Tenant', TenantSchema);
