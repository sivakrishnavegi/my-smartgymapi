import { submitCorrectionRequest, getCorrectionRequests, resolveCorrectionRequest } from "@academics/controllers/attendenceController";
import { AttendanceCorrection as AttendanceCorrectionModel } from "@academics/models/attendanceCorrection.schema";
import { Attendance as StudentAttendanceModel } from "@academics/models/attendence.schema";
import mongoose from "mongoose";

// Mock dependencies
const mockQuery: any = {
    exec: jest.fn().mockResolvedValue([]),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    session: jest.fn().mockReturnThis(),
    then: jest.fn(function (this: any, resolve: any) {
        return Promise.resolve(this.exec()).then(resolve);
    }),
};

jest.mock("mongoose", () => {
    return {
        Types: {
            ObjectId: class {
                constructor(id: any) { return id; }
                static isValid(id: any) { return true; }
                toString() { return "mockObjectId"; }
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
            bulkWrite: jest.fn(),
        }),
        startSession: jest.fn().mockResolvedValue({
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
        }),
    };
});

jest.mock("@academics/models/attendanceCorrection.schema", () => ({
    __esModule: true,
    AttendanceCorrection: {
        find: jest.fn(() => mockQuery),
        findById: jest.fn(() => mockQuery),
        create: jest.fn(),
        countDocuments: jest.fn().mockResolvedValue(0),
    },
}));

jest.mock("@academics/models/attendence.schema", () => ({
    __esModule: true,
    Attendance: {
        findById: jest.fn(),
    },
}));

jest.mock("@shared/utils/errorLogger");

describe("Attendance Correction Controller", () => {
    let req: any;
    let res: any;
    const userId = new mongoose.Types.ObjectId().toString();

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

    describe("submitCorrectionRequest", () => {
        it("should return 400 if required fields are missing", async () => {
            req.body = { attendanceId: "123" }; // Missing requestedStatus, reason
            await submitCorrectionRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 404 if attendance record not found", async () => {
            req.body = {
                attendanceId: new mongoose.Types.ObjectId(),
                requestedStatus: "Present",
                reason: "Error"
            };
            (StudentAttendanceModel.findById as jest.Mock).mockResolvedValue(null);

            await submitCorrectionRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("should create correction request successfully", async () => {
            const attendanceId = new mongoose.Types.ObjectId();
            req.body = {
                attendanceId,
                requestedStatus: "Present",
                reason: "System Error"
            };

            const mockAttendance = {
                _id: attendanceId,
                tenantId: "t1",
                schoolId: "s1",
                classId: "c1",
                sectionId: "sec1",
                studentId: "stu1",
                date: new Date(),
                status: "Absent"
            };
            (StudentAttendanceModel.findById as jest.Mock).mockResolvedValue(mockAttendance);
            (AttendanceCorrectionModel.create as jest.Mock).mockResolvedValue({ _id: "corr1", ...req.body });

            await submitCorrectionRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(AttendanceCorrectionModel.create).toHaveBeenCalled();
        });
    });

    describe("getCorrectionRequests", () => {
        it("should return 400 if tenantId or schoolId missing", async () => {
            req.query = {};
            await getCorrectionRequests(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return paginated requests", async () => {
            req.query = { tenantId: "t1", schoolId: new mongoose.Types.ObjectId().toString() };
            (AttendanceCorrectionModel.find as jest.Mock).mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([{ _id: "corr1" }])
            });
            (AttendanceCorrectionModel.countDocuments as jest.Mock).mockResolvedValue(1);

            await getCorrectionRequests(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.any(Array)
            }));
        });
    });

    describe("resolveCorrectionRequest", () => {
        it("should return 400 for invalid status", async () => {
            req.params = { requestId: "req1" };
            req.body = { status: "Invalid" };
            await resolveCorrectionRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 404 if request not found", async () => {
            req.params = { requestId: "req1" };
            req.body = { status: "Approved" };
            const mockRequestQuery: any = {
                session: jest.fn().mockResolvedValue(null)
            };
            (AttendanceCorrectionModel.findById as jest.Mock).mockReturnValue(mockRequestQuery);

            await resolveCorrectionRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("should approve request and update attendance", async () => {
            req.params = { requestId: "req1" };
            req.body = { status: "Approved" };

            const attendanceId = new mongoose.Types.ObjectId();
            const mockRequest = {
                _id: "req1",
                status: "Pending",
                attendanceId: attendanceId,
                requestedStatus: "Present",
                save: jest.fn()
            };

            const mockRequestQuery: any = {
                session: jest.fn().mockResolvedValue(mockRequest)
            };
            (AttendanceCorrectionModel.findById as jest.Mock).mockReturnValue(mockRequestQuery);

            const mockAttendance = {
                _id: attendanceId,
                status: "Absent",
                save: jest.fn(),
                editHistory: []
            };

            const mockAttendanceQuery: any = {
                session: jest.fn().mockResolvedValue(mockAttendance)
            };

            (StudentAttendanceModel.findById as jest.Mock).mockReturnValue(mockAttendanceQuery);

            await resolveCorrectionRequest(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockRequest.save).toHaveBeenCalled();
            expect(mockAttendance.save).toHaveBeenCalled();
        });
    });
});
