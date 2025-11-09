"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
const mongoose_1 = require("mongoose");
const guardianSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    relation: { type: String, enum: ["Father", "Mother", "Guardian"], required: true },
    phone: { type: String, required: true },
    email: { type: String },
    occupation: { type: String },
    address: { type: String },
}, { _id: false });
const studentSchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Types.ObjectId, ref: "Tenant", required: true },
    schoolId: { type: mongoose_1.Types.ObjectId, ref: "School", required: true },
    classId: { type: mongoose_1.Types.ObjectId, ref: "Class", required: true },
    sectionId: { type: mongoose_1.Types.ObjectId, ref: "Section", required: true },
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
        currentClass: { type: mongoose_1.Types.ObjectId, ref: "Class" },
        currentSection: { type: mongoose_1.Types.ObjectId, ref: "Section" },
        history: [
            {
                classId: { type: mongoose_1.Types.ObjectId, ref: "Class" },
                sectionId: { type: mongoose_1.Types.ObjectId, ref: "Section" },
                session: { type: String }, // e.g. "2024-25"
            },
        ],
    },
    documents: {
        photo: { type: String },
        birthCertificate: { type: String },
        idProof: { type: String },
    },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
}, { timestamps: true });
exports.Student = (0, mongoose_1.model)("Student", studentSchema);
