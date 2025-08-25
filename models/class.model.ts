import { Schema, model } from "mongoose";
import { IClass } from "./types/class.types";

const ClassSchema = new Schema<IClass>({
  tenantId: { type: String, required: true, index: true },
  schoolId: {
    type: Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  code: { type: String, unique: true },
  description: { type: String },
  academicSession: { type: String },
  medium: { type: String },
  shift: { type: String, enum: ["Morning", "Evening"] },

  sections: [{ type: Schema.Types.ObjectId, ref: "Section" }],
  classTeacher: { type: Schema.Types.ObjectId, ref: "User" },

  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
});

export const ClassModel = model<IClass>("Class", ClassSchema);
