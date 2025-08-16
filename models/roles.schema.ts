import { Schema, model, Types, Document } from "mongoose";

export interface IRole extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: Date;
}

const RoleSchema = new Schema<IRole>({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true }, // ✅ FIXED
  name: { type: String, required: true },
  description: { type: String },
  permissions: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const RoleModel = model<IRole>("Role", RoleSchema);
