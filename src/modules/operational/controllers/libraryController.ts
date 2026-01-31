import { Request, Response } from "express";
import { LibraryBookModel } from "@operational/models/libraryBook.model";
import { LibraryBookCopyModel } from "@operational/models/libraryBookCopy.model";
import { LibraryTransactionModel } from "@operational/models/libraryTransaction.model";
import UserModel from "@iam/models/users.schema";
import { Types } from "mongoose";

// --- Book Management ---

export const addBook = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId } = req.body; // Assuming middleware sets these or passed in body
        // In a real app, strict validation of tenantId/schoolId from auth token is needed.
        // Assuming req.body contains the book details

        const { title, author, isbn, quantity, ...otherDetails } = req.body;

        // Check if book exists by ISBN in this school
        let book = await LibraryBookModel.findOne({ tenantId, schoolId, isbn });

        if (book) {
            // Update quantity if user wants to add more copies to existing book (optional flow, usually separate)
            // For now, let's say we just return it exists.
            return res.status(409).json({ message: "Book with this ISBN already exists", book });
        }

        book = new LibraryBookModel({
            tenantId,
            schoolId,
            title,
            author,
            isbn,
            copies: 0, // Will be updated when copies are added
            available: 0,
            ...otherDetails
        });

        await book.save();

        // If quantity is provided, strictly speaking we should create 'quantity' number of copies.
        // Let's automate that common workflow.
        if (quantity && quantity > 0) {
            const copies = [];
            for (let i = 0; i < quantity; i++) {
                // Generate a simple accession number logic (e.g., ISBN-SEQ)
                // In prod, use a counter or robust generator
                const count = await LibraryBookCopyModel.countDocuments({ tenantId, schoolId });
                const accessionNumber = `LIB-${Date.now()}-${i}`;

                copies.push({
                    tenantId,
                    schoolId,
                    bookId: book._id,
                    accessionNumber,
                    status: "AVAILABLE",
                });
            }
            await LibraryBookCopyModel.insertMany(copies);
            book.copies = quantity;
            book.available = quantity;
            await book.save();
        }

        res.status(201).json({ message: "Book created successfully", book });
    } catch (error: any) {
        res.status(500).json({ message: "Error adding book", error: error.message });
    }
};

export const addBookCopy = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId, bookId, accessionNumber, qrCode } = req.body;

        const book = await LibraryBookModel.findOne({ _id: bookId, tenantId, schoolId });
        if (!book) return res.status(404).json({ message: "Book not found" });

        const copy = new LibraryBookCopyModel({
            tenantId,
            schoolId,
            bookId,
            accessionNumber,
            qrCode,
            status: "AVAILABLE"
        });

        await copy.save();

        // Update book counts
        book.copies += 1;
        book.available += 1;
        await book.save();

        res.status(201).json({ message: "Copy added successfully", copy });
    } catch (error: any) {
        res.status(500).json({ message: "Error adding copy", error: error.message });
    }
};

// --- Issue / Return ---

export const issueBook = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId, bookId, userId, copyId, dueDate } = req.body;
        // copyId is optional if we want to auto-select an available copy, 
        // but typically barcode scanning implies specific copyId (or accessionNumber).
        // Let's assume copyId (_id of the copy) is passed.

        // 1. Validate User
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.tenantId !== tenantId) return res.status(403).json({ message: "User does not belong to this tenant" });

        // 2. Validate Copy
        const copy = await LibraryBookCopyModel.findOne({ _id: copyId, tenantId, schoolId });
        if (!copy) return res.status(404).json({ message: "Book copy not found" });

        if (copy.status !== "AVAILABLE") {
            return res.status(400).json({ message: `Copy is currently ${copy.status}` });
        }

        // 3. Check for existing active transaction for this book (all copies) by this user?
        // Maybe allow multiple copies of same book? Usually no.
        const existingIssue = await LibraryTransactionModel.findOne({
            tenantId,
            schoolId,
            userId,
            bookId: copy.bookId,
            status: { $in: ["ISSUED", "OVERDUE"] }
        });

        if (existingIssue) {
            return res.status(400).json({ message: "User already has a copy of this book issued." });
        }

        // 4. Create Transaction
        const transaction = new LibraryTransactionModel({
            tenantId,
            schoolId,
            bookId: copy.bookId,
            copyId: copy._id,
            userId,
            userRole: user.userType,
            classId: user.enrollment?.classId,
            sectionId: user.enrollment?.sectionId,
            type: "issue",
            status: "ISSUED",
            issuedAt: new Date(),
            dueDate: new Date(dueDate), // Client provides due date, or default logic here
            issuedBy: req.body.issuedBy // Optional: ID of staff performing action
        });

        await transaction.save();

        // 5. Update Copy Status
        copy.status = "ISSUED";
        await copy.save();

        // 6. Update Book Availability
        await LibraryBookModel.findByIdAndUpdate(copy.bookId, { $inc: { available: -1 } });

        res.status(200).json({ message: "Book issued successfully", transaction });

    } catch (error: any) {
        res.status(500).json({ message: "Error issuing book", error: error.message });
    }
};

export const returnBook = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId, copyId, remarks } = req.body;
        // Could also find by transactionId, but typically we scan a book to return it.

        // 1. Find active transaction for this copy
        const transaction = await LibraryTransactionModel.findOne({
            tenantId,
            schoolId,
            copyId,
            status: { $in: ["ISSUED", "OVERDUE"] }
        });

        if (!transaction) {
            return res.status(404).json({ message: "No active issue record found for this book copy." });
        }

        // 2. Calculate Fines
        const now = new Date();
        let fineAmount = 0;
        if (now > transaction.dueDate) {
            const diffTime = Math.abs(now.getTime() - transaction.dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const finePerDay = 10; // TODO: Configurable setting
            fineAmount = diffDays * finePerDay;
        }

        // 3. Update Transaction
        transaction.status = "RETURNED";
        transaction.returnedAt = now;
        transaction.fineAmount = fineAmount;
        transaction.remarks = remarks;
        transaction.type = "return"; // Or create a separate return record? Schema has type field. 
        // Wait, schema has 'type' field. If I update this doc, I lose the 'issue' record history?
        // Actually, the previous 'type' was 'issue'. If I change it to 'return', I lose the fact it was an issue.
        // Better: The transaction record REPRESENTS the lifecycle. 
        // 'type' field in schema is 'issue' | 'return'. 
        // If I use a single document for the whole cycle, maybe 'type' is redundant or means 'current state action'.
        // Let's assume the Transaction document records the ISSUE event.
        // Return event updates the SAME document? 
        // Or create a NEW document for return?
        // Schema has `returnedAt`. It implies single doc per lifecycle.
        // But `type` field enum ["issue", "return"] suggests disparate events.
        // Given the prompt asked for "issue return history", standard audit log approach is separate events using a parent 'RequestId' or similar.
        // BUT my schema `LibraryTransaction` has `issuedAt` AND `returnedAt` in one doc. 
        // This suggests one doc = one full cycle (Issue -> Return).
        // The `type` field might be redundant or used if we split them.
        // I will stick to single doc = request cycle. I will ignore 'type' or set it to 'return' to indicate the cycle is complete?
        // Let's keep 'type' as 'issue' (the originating type) or maybe 'cycle'.
        // Actually, looking at the schema: `type: { type: String, enum: ["issue", "return"], required: true }`
        // If I update it, it's fine.

        await transaction.save();

        // 4. Update Copy
        const copy = await LibraryBookCopyModel.findOne({ _id: copyId });
        if (copy) {
            copy.status = "AVAILABLE";
            await copy.save();
            // 5. Update Book
            await LibraryBookModel.findByIdAndUpdate(copy.bookId, { $inc: { available: 1 } });
        }

        res.status(200).json({ message: "Book returned successfully", transaction, fineAmount });

    } catch (error: any) {
        res.status(500).json({ message: "Error returning book", error: error.message });
    }
};

// --- Queries ---

export const getBooks = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId, search, page = 1, limit = 10 } = req.query;

        const query: any = { tenantId, schoolId, isDeleted: false };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { author: { $regex: search, $options: "i" } },
                { isbn: { $regex: search, $options: "i" } }
            ];
        }

        const books = await LibraryBookModel.find(query)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await LibraryBookModel.countDocuments(query);

        res.status(200).json({ books, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching books", error: error.message });
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId, userId, status } = req.query;
        const query: any = { tenantId, schoolId };

        if (userId) query.userId = userId;
        if (status) query.status = status;

        const transactions = await LibraryTransactionModel.find(query)
            .populate("bookId", "title author")
            .populate("copyId", "accessionNumber")
            .populate("userId", "profile.firstName profile.lastName enrollment.regNo")
            .sort({ updatedAt: -1 });

        res.status(200).json(transactions);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching transactions", error: error.message });
    }
}
