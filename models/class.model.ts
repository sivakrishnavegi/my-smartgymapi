import { Schema, model } from "mongoose";
import { IClass } from "./types/class.types";

const ClassSchema = new Schema<IClass>({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const ClassModel = model<IClass>("Class", ClassSchema);
