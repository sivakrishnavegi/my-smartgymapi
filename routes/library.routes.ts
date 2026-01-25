import { Router } from "express";
import {
    addBook,
    addBookCopy,
    issueBook,
    returnBook,
    getBooks,
    getTransactions
} from "../controllers/libraryController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

// Protect all routes
router.use(protect);

router.post("/books", addBook);
router.post("/books/copy", addBookCopy); // Add copy to existing book
router.get("/books", getBooks);

router.post("/issue", issueBook);
router.post("/return", returnBook);
router.get("/transactions", getTransactions);

export default router;
