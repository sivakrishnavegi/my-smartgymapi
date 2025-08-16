import { Schema, model } from "mongoose";
import { ILibraryTransaction } from "./types/library.types";

const LibraryTransactionSchema = new Schema<ILibraryTransaction>({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  bookId: { type: Schema.Types.ObjectId, ref: "LibraryBook", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["issue", "return"], required: true },
  issuedAt: { type: Date },
  returnedAt: { type: Date },
});

export const LibraryTransactionModel = model<ILibraryTransaction>("LibraryTransaction", LibraryTransactionSchema);
