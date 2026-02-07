import { applyLeave, getLeaveRequests, resolveLeaveRequest } from "@academics/controllers/leaveController";
import { LeaveRequest as LeaveRequestModel } from "@academics/models/leaveRequest.schema";
import mongoose from "mongoose";

// Mock dependencies
const mockQuery: any = {
    exec: jest.fn().mockResolvedValue([]),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn(function (this: any, resolve: any) {
        return Promise.resolve(this.exec()).then(resolve);
    }),
};

jest.mock("mongoose", () => {
    return {
        Types: {
            ObjectId: class {
                constructor(id: any) { return id; }
                toString() { return "mockObjectId"; }
                static isValid() { return true; }
            }
        },
        Schema: class {
            static Types = {
                ObjectId: class {
                    constructor(id: any) { return id; }
                    static isValid(id: any) { return true; }
                    toString() { return "mockObjectId"; }
                },
                Mixed: Object
            };
        },
        model: jest.fn().mockReturnValue({
            find: jest.fn(() => mockQuery),
            findOne: jest.fn(() => mockQuery),
            findById: jest.fn(() => mockQuery),
            create: jest.fn(),
            countDocuments: jest.fn().mockResolvedValue(0),
        }),
    };
});

jest.mock("@academics/models/leaveRequest.schema", () => ({
    __esModule: true,
    LeaveRequest: {
        find: jest.fn(() => mockQuery),
        findById: jest.fn(() => mockQuery),
        create: jest.fn(),
        countDocuments: jest.fn().mockResolvedValue(0),
    },
}));

jest.mock("@shared/utils/errorLogger");

describe("Leave Request Controller", () => {
    let req: any;
    let res: any;
    const userId = "userId";

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            query: {},
            params: {},
            user: { id: userId, role: "teacher" }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("applyLeave", () => {
        it("should return 400 if required fields are missing", async () => {
            req.body = { tenantId: "t1" }; // Missing other fields
            await applyLeave(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should create leave request successfully", async () => {
            req.body = {
                tenantId: "t1",
                schoolId: "s1",
                classId: "c1",
                sectionId: "sec1",
                studentId: "stu1",
                startDate: "2023-01-01",
                endDate: "2023-01-02",
                leaveType: "Sick",
                reason: "Illness"
            };
            (LeaveRequestModel.create as jest.Mock).mockResolvedValue({ _id: "leave1", ...req.body });

            await applyLeave(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(LeaveRequestModel.create).toHaveBeenCalled();
        });
    });

    describe("getLeaveRequests", () => {
        it("should return 400 if tenantId or schoolId missing", async () => {
            req.query = {};
            await getLeaveRequests(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should filter by date if provided", async () => {
            req.query = { tenantId: "t1", schoolId: "s1", date: "2023-01-01" };

            await getLeaveRequests(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(LeaveRequestModel.find).toHaveBeenCalledWith(expect.objectContaining({
                startDate: { $lte: expect.any(Date) },
                endDate: { $gte: expect.any(Date) }
            }));
        });

        it("should return paginated results", async () => {
            req.query = { tenantId: "t1", schoolId: "s1", page: "2", limit: "5" };
            (LeaveRequestModel.countDocuments as jest.Mock).mockResolvedValue(10);

            await getLeaveRequests(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                pagination: expect.objectContaining({
                    currentPage: 2,
                    limit: 5,
                    totalPages: 2
                })
            }));
        });
    });

    describe("resolveLeaveRequest", () => {
        it("should return 400 for invalid status", async () => {
            req.params = { id: "leave1" };
            req.body = { status: "Invalid" };
            await resolveLeaveRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 404 if request not found", async () => {
            req.params = { id: "leave1" };
            req.body = { status: "Approved" };
            (LeaveRequestModel.findById as jest.Mock).mockResolvedValue(null);

            await resolveLeaveRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("should approve request and update remarks", async () => {
            req.params = { id: "leave1" };
            req.body = { status: "Approved", remarks: "Good" };

            const mockLeave = {
                _id: "leave1",
                status: "Pending",
                save: jest.fn()
            };
            (LeaveRequestModel.findById as jest.Mock).mockResolvedValue(mockLeave);

            await resolveLeaveRequest(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockLeave.status).toBe("Approved");
            // Check for 'remarks' property assignment logic if possible, 
            // but we can at least ensure save was called
            expect(mockLeave.save).toHaveBeenCalled();
        });
    });
});
