import { Schema, model, Types } from "mongoose";

const guardianSchema = new Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, enum: ["Father", "Mother", "Guardian"], required: true },
    phone: { type: String, required: true },
    email: { type: String },
    occupation: { type: String },
    address: { type: String },
  },
  { _id: false }
);

const studentSchema = new Schema(
  {
    tenantId: { type: String, required: true },
    schoolId: { type: Types.ObjectId, ref: "School", required: true },
    classId: { type: Types.ObjectId, ref: "Class", required: true },
    sectionId: { type: Types.ObjectId, ref: "Section", required: true },

    admissionNo: { type: String, required: true, unique: true },
    rollNo: { type: String },
    admissionDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Transferred", "Graduated"],
      default: "Active",
    },

    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },

    contact: {
      phone: { type: String },
      email: { type: String },
      address: {
        line1: { type: String },
        line2: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String, default: "India" },
      },
    },

    guardians: [guardianSchema],

    academic: {
      currentClass: { type: Types.ObjectId, ref: "Class" },
      currentSection: { type: Types.ObjectId, ref: "Section" },
      history: [
        {
          classId: { type: Types.ObjectId, ref: "Class" },
          sectionId: { type: Types.ObjectId, ref: "Section" },
          session: { type: String }, // e.g. "2024-25"
        },
      ],
    },

    documents: {
      photo: { type: String },
      birthCertificate: { type: String },
      idProof: { type: String },
    },

    createdBy: { type: Types.ObjectId, ref: "User" },
    updatedBy: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Student = model("Student", studentSchema);
