import { Document, Types } from "mongoose";

export interface ILibraryBook extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  title: string;
  author: string;
  isbn: string;
  copies: number;
  available: number;
  createdAt: Date;
}

export type TransactionType = "issue" | "return";

export interface ILibraryTransaction extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  bookId: Types.ObjectId;
  userId: Types.ObjectId;
  type: TransactionType;
  issuedAt?: Date;
  returnedAt?: Date;
}
