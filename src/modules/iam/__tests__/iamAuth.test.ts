import { login, signup, logout } from "@iam/controllers/authController";
import User from "@iam/models/users.schema";
import { SessionModel } from "@iam/models/SessionSchema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Mock dependencies
jest.mock("@iam/models/users.schema", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        syncIndexes: jest.fn().mockResolvedValue({}),
    }
}));
jest.mock("@iam/models/SessionSchema");
jest.mock("bcrypt");
jest.mock("@shared/utils/errorLogger");
jest.mock("@shared/utils/genarateToken", () => ({
    generateToken: jest.fn(() => "mock-token")
}));

describe("IAM AuthController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            cookies: {},
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
            clearCookie: jest.fn()
        };
    });

    describe("login", () => {
        it("should return 200 on successful login", async () => {
            req.body = { email: "test@example.com", password: "password" };
            const mockUser = {
                _id: "user-123",
                account: { primaryEmail: "test@example.com", passwordHash: "hashed" },
                userType: "teacher"
            };
            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Login successful",
                user: expect.objectContaining({ id: "user-123" })
            }));
        });

        it("should return 401 on invalid credentials", async () => {
            (User.findOne as jest.Mock).mockResolvedValue(null);
            await login(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe("signup", () => {
        it("should return 201 on successful signup", async () => {
            req.body = { email: "new@example.com", password: "password", role: "teacher" };
            (User.findOne as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
            (User.create as jest.Mock).mockResolvedValue({
                _id: "new-123",
                userType: "teacher",
                account: { primaryEmail: "new@example.com" }
            });

            await signup(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "User registered successfully"
            }));
        });
    });

    describe("logout", () => {
        it("should return 200 on successful logout", async () => {
            req.cookies = { refreshToken: "token-123" };
            await logout(req, res);
            expect(SessionModel.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
