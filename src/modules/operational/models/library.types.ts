import { Document, Types } from "mongoose";

export type BookStatus = "AVAILABLE" | "ISSUED" | "LOST" | "MAINTENANCE" | "RESERVED";
export type TransactionStatus = "ISSUED" | "RETURNED" | "OVERDUE" | "LOST" | "CANCELLED";
export type TransactionType = "issue" | "return";

export interface ILibraryBook extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  title: string;
  author: string;
  isbn: string;
  publisher?: string;
  category?: string;
  description?: string;
  shelfLocation?: string;
  coverImage?: string;
  copies: number; // Total physical copies
  available: number; // Currently available copies
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILibraryBookCopy extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  bookId: Types.ObjectId;
  accessionNumber: string; // Unique identifier for the physical copy (e.g., LIB-001)
  qrCode?: string; // For scanning
  status: BookStatus;
  condition?: string;
  purchaseDate?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILibraryTransaction extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  bookId: Types.ObjectId;
  copyId: Types.ObjectId; // Specific copy being issued
  userId: Types.ObjectId;
  userRole: string; // "student", "teacher", etc.
  classId?: Types.ObjectId; // For students
  sectionId?: Types.ObjectId; // For students
  type: TransactionType;
  status: TransactionStatus;
  issuedAt: Date;
  dueDate: Date; // Important for calculating fines
  returnedAt?: Date;
  fineAmount?: number;
  finePaid?: boolean;
  remarks?: string;
  issuedBy?: Types.ObjectId; // User (Librarian/Admin) who processed the issue
  isDeleted: boolean;
}
