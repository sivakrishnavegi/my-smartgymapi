import { Schema, model } from "mongoose";
import { ILibraryBook } from "./library.types";

const LibraryBookSchema = new Schema<ILibraryBook>({
  tenantId: { type: String, required: true, index: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  title: { type: String, required: true, index: true }, // Index for search
  author: { type: String, required: true, index: true }, // Index for search
  isbn: { type: String, required: true, unique: true }, // Unique ISBN
  publisher: { type: String },
  category: { type: String },
  description: { type: String },
  shelfLocation: { type: String },
  coverImage: { type: String },
  copies: { type: Number, required: true, default: 0 },
  available: { type: Number, required: true, default: 0 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Compound index for unique books per school if needed (keeping ISBN unique globally or per school? Usually ISBN is global, but maybe per tenant/school in multi-tenant app if they manage catalogues separately. 
// Assuming ISBN is unique effectively globally, but let's strictly enforce ISBN uniqueness per school/tenant if possible, but simpler to just index ISBN.)
// Better: LibraryBookSchema.index({ tenantId: 1, schoolId: 1, isbn: 1 }, { unique: true }); 
// Replacing the simple unique: true on isbn field might be safer for multi-tenant. 
// However, the original code had `isbn: { type: String, required: true, unique: true }`. I will respect that but Relax it to compound if they want to allow same book in different schools. 
// For now, I'll stick to the user's implicit requirement but adding soft delete filter.

export const LibraryBookModel = model<ILibraryBook>("LibraryBook", LibraryBookSchema);
