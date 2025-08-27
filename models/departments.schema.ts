import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
  name: string; 
  code: string; 
  type: "academic" | "administrative"; 
  description?: string; 

  head?: mongoose.Types.ObjectId;
  staff: mongoose.Types.ObjectId[];
  students: mongoose.Types.ObjectId[];

  establishedYear?: number;
  contactEmail?: string;
  contactPhone?: string;

  status: "active" | "inactive";

  createdBy: mongoose.Types.ObjectId; 
  updatedBy?: mongoose.Types.ObjectId; 

  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    type: {
      type: String,
      enum: ["academic", "administrative"],
      default: "academic",
    },
    description: { type: String },

    head: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    establishedYear: { type: Number },
    contactEmail: { type: String, lowercase: true },
    contactPhone: { type: String },

    status: { type: String, enum: ["active", "inactive"], default: "active" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Department ||
  mongoose.model<IDepartment>("Department", DepartmentSchema);
