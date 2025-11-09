"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryTransactionModel = void 0;
const mongoose_1 = require("mongoose");
const LibraryTransactionSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    schoolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "School", required: true, index: true },
    bookId: { type: mongoose_1.Schema.Types.ObjectId, ref: "LibraryBook", required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["issue", "return"], required: true },
    issuedAt: { type: Date },
    returnedAt: { type: Date },
});
exports.LibraryTransactionModel = (0, mongoose_1.model)("LibraryTransaction", LibraryTransactionSchema);
