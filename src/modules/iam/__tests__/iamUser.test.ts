import { createUser, listUsers, getUserById } from "@iam/controllers/userController";
import User from "@iam/models/users.schema";

// Mock dependencies
const mockQuery: any = {
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn(),
};

jest.mock("@iam/models/users.schema", () => ({
    __esModule: true,
    default: {
        find: jest.fn(() => mockQuery),
        findById: jest.fn(() => mockQuery),
        findByIdAndUpdate: jest.fn(() => mockQuery),
        findByIdAndDelete: jest.fn(() => mockQuery),
        findOne: jest.fn(() => mockQuery),
        syncIndexes: jest.fn().mockResolvedValue({}),
    }
}));
jest.mock("@shared/utils/errorLogger");

const VALID_ID = "64eaf47a93a9baf21d6d4a1c";

describe("IAM UserController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.exec.mockReset();
        mockQuery.populate.mockReturnThis();
        mockQuery.select.mockReturnThis();

        // Ensure await on the query object works by mocking .then
        mockQuery.then = jest.fn((resolve, reject) => {
            return mockQuery.exec().then(resolve, reject);
        });

        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("listUsers", () => {
        it("should return list of users", async () => {
            mockQuery.exec.mockResolvedValue([]);
            await listUsers(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(Array.isArray(res.json.mock.calls[0][0])).toBe(true);
        });
    });

    describe("getUserById", () => {
        it("should return user if found", async () => {
            req.params.id = VALID_ID;
            const mockUser = { _id: VALID_ID, email: "test@test.com" };
            mockQuery.exec.mockResolvedValue(mockUser);

            await getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it("should return 404 if not found", async () => {
            req.params.id = VALID_ID;
            mockQuery.exec.mockResolvedValue(null);
            await getUserById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
