import { Schema, model } from "mongoose";
import { ILibraryBookCopy } from "./types/library.types";

const LibraryBookCopySchema = new Schema<ILibraryBookCopy>({
    tenantId: { type: String, required: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    bookId: { type: Schema.Types.ObjectId, ref: "LibraryBook", required: true, index: true },
    accessionNumber: { type: String, required: true }, // e.g. LIB-001
    qrCode: { type: String },
    status: {
        type: String,
        enum: ["AVAILABLE", "ISSUED", "LOST", "MAINTENANCE", "RESERVED"],
        default: "AVAILABLE",
        index: true
    },
    condition: { type: String, default: "Good" },
    purchaseDate: { type: Date },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure accession number is unique per school
LibraryBookCopySchema.index({ tenantId: 1, schoolId: 1, accessionNumber: 1 }, { unique: true });

export const LibraryBookCopyModel = model<ILibraryBookCopy>("LibraryBookCopy", LibraryBookCopySchema);
