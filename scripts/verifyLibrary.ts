import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/ds';
import { LibraryBookModel } from '../models/libraryBook.model';
import { LibraryBookCopyModel } from '../models/libraryBookCopy.model';
import { LibraryTransactionModel } from '../models/libraryTransaction.model';
import mongoose from 'mongoose';

const run = async () => {
    try {
        await connectDB();
        console.log("DB Connected");

        const tenantId = "verify-tenant";
        const schoolId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId(); // Dummy user

        // 1. Create Book
        console.log("Creating Book...");
        const book = await LibraryBookModel.create({
            tenantId,
            schoolId,
            title: "Verification Book",
            author: "Tester",
            isbn: `VERIFY-${Date.now()}`,
            copies: 0,
            available: 0
        });
        console.log("Book Created:", book.title);

        // 2. Create Copy
        console.log("Creating Copy...");
        const copy = await LibraryBookCopyModel.create({
            tenantId,
            schoolId,
            bookId: book._id,
            accessionNumber: `COPY-${Date.now()}`,
            status: "AVAILABLE"
        });

        // Simulate what controller does
        await LibraryBookModel.findByIdAndUpdate(book._id, { $inc: { copies: 1, available: 1 } });
        console.log("Copy Created:", copy.accessionNumber);

        // 3. Issue Book
        console.log("Issuing Book...");
        const transaction = await LibraryTransactionModel.create({
            tenantId,
            schoolId,
            bookId: book._id,
            copyId: copy._id,
            userId,
            userRole: "student",
            type: "issue",
            status: "ISSUED",
            issuedAt: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await LibraryBookCopyModel.findByIdAndUpdate(copy._id, { status: "ISSUED" });
        await LibraryBookModel.findByIdAndUpdate(book._id, { $inc: { available: -1 } });
        console.log("Book Issued. Transaction ID:", transaction._id);

        // 4. Return Book
        console.log("Returning Book...");
        await LibraryTransactionModel.findByIdAndUpdate(transaction._id, {
            status: "RETURNED",
            returnedAt: new Date(),
            type: "return", // Note: type logic might vary as discussed, but this updates the record
            fineAmount: 0
        });
        await LibraryBookCopyModel.findByIdAndUpdate(copy._id, { status: "AVAILABLE" });
        await LibraryBookModel.findByIdAndUpdate(book._id, { $inc: { available: 1 } });
        console.log("Book Returned.");

        // Clean up
        console.log("Cleaning up...");
        await LibraryBookModel.deleteOne({ _id: book._id });
        await LibraryBookCopyModel.deleteOne({ _id: copy._id });
        await LibraryTransactionModel.deleteOne({ _id: transaction._id });
        console.log("Clean up done.");

    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

run();
