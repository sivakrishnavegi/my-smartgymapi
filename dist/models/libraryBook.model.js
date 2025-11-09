"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryBookModel = void 0;
const mongoose_1 = require("mongoose");
const LibraryBookSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    schoolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "School", required: true, index: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true, unique: true },
    copies: { type: Number, required: true },
    available: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});
exports.LibraryBookModel = (0, mongoose_1.model)("LibraryBook", LibraryBookSchema);
