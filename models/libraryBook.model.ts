import { Schema, model } from "mongoose";
import { ILibraryBook } from "./types/library.types";

const LibraryBookSchema = new Schema<ILibraryBook>({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  copies: { type: Number, required: true },
  available: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const LibraryBookModel = model<ILibraryBook>("LibraryBook", LibraryBookSchema);
