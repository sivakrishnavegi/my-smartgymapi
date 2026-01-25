import { Schema, model } from "mongoose";
import { ILibraryTransaction } from "./types/library.types";

const LibraryTransactionSchema = new Schema<ILibraryTransaction>({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  bookId: { type: Schema.Types.ObjectId, ref: "LibraryBook", required: true, index: true },
  copyId: { type: Schema.Types.ObjectId, ref: "LibraryBookCopy", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  userRole: { type: String, required: true }, // e.g., "student", "teacher"
  classId: { type: Schema.Types.ObjectId, ref: "Class" }, // Optional, for students
  sectionId: { type: Schema.Types.ObjectId, ref: "Section" }, // Optional, for students
  type: { type: String, enum: ["issue", "return"], required: true },
  status: {
    type: String,
    enum: ["ISSUED", "RETURNED", "OVERDUE", "LOST", "CANCELLED"],
    required: true,
    default: "ISSUED",
    index: true
  },
  issuedAt: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnedAt: { type: Date },
  fineAmount: { type: Number, default: 0 },
  finePaid: { type: Boolean, default: false },
  remarks: { type: String },
  issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export const LibraryTransactionModel = model<ILibraryTransaction>("LibraryTransaction", LibraryTransactionSchema);
