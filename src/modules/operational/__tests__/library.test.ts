import { addBook, getBooks, issueBook } from "../controllers/libraryController";
import { LibraryBookModel } from "@operational/models/libraryBook.model";
import { LibraryBookCopyModel } from "@operational/models/libraryBookCopy.model";
import { LibraryTransactionModel } from "@operational/models/libraryTransaction.model";
import UserModel from "@iam/models/users.schema";

// Helper to create a chainable mock query
const createMockQuery = () => {
    const query: any = {
        exec: jest.fn(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        countDocuments: jest.fn().mockReturnThis(),
        then: jest.fn(function (this: any, resolve: any) {
            return Promise.resolve(this.exec()).then(resolve);
        }),
    };
    return query;
};

const bookQuery = createMockQuery();
const copyQuery = createMockQuery();
const transactionQuery = createMockQuery();
const userQuery = createMockQuery();

jest.mock("@operational/models/libraryBook.model", () => ({
    __esModule: true,
    LibraryBookModel: jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "b1", title: "Test Book" })
    })) as any
}));
(LibraryBookModel as any).findOne = jest.fn(() => bookQuery);
(LibraryBookModel as any).find = jest.fn(() => bookQuery);
(LibraryBookModel as any).findByIdAndUpdate = jest.fn().mockResolvedValue({});
(LibraryBookModel as any).countDocuments = jest.fn(() => bookQuery);

jest.mock("@operational/models/libraryBookCopy.model", () => ({
    __esModule: true,
    LibraryBookCopyModel: jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "c1", accessionNumber: "ACC1" })
    })) as any
}));
(LibraryBookCopyModel as any).findOne = jest.fn(() => copyQuery);
(LibraryBookCopyModel as any).insertMany = jest.fn().mockResolvedValue([]);
(LibraryBookCopyModel as any).countDocuments = jest.fn().mockResolvedValue(0);

jest.mock("@operational/models/libraryTransaction.model", () => ({
    __esModule: true,
    LibraryTransactionModel: jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "t1", status: "ISSUED" })
    })) as any
}));
(LibraryTransactionModel as any).findOne = jest.fn(() => transactionQuery);

jest.mock("@iam/models/users.schema", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(() => userQuery),
        findOne: jest.fn(() => userQuery),
    },
}));

describe("LibraryController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: { tenantId: "t1", schoolId: "s1" },
            query: { tenantId: "t1", schoolId: "s1" }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("addBook", () => {
        it("should add a new book", async () => {
            bookQuery.exec.mockResolvedValue(null); // No existing book
            req.body = { ...req.body, title: "Modern Physics", author: "H.C. Verma", isbn: "123456", quantity: 5 };

            await addBook(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Book created successfully" }));
        });
    });

    describe("getBooks", () => {
        it("should list books", async () => {
            bookQuery.exec.mockResolvedValue([]);
            await getBooks(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe("issueBook", () => {
        it("should issue a book to user", async () => {
            userQuery.exec.mockResolvedValue({ _id: "u1", tenantId: "t1", userType: "student" });
            copyQuery.exec.mockResolvedValue({
                _id: "c1",
                bookId: "b1",
                status: "AVAILABLE",
                save: jest.fn().mockResolvedValue(true)
            });
            transactionQuery.exec.mockResolvedValue(null); // No existing issue

            req.body = { ...req.body, bookId: "b1", userId: "u1", copyId: "c1", dueDate: new Date() };

            await issueBook(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Book issued successfully" }));
        });
    });
});
