import { getCompleteStudentDetails } from "../controllers/studentController";
import { Student } from "@academics/models/student.schema";
import UserModel from "@iam/models/users.schema";
import { ClassModel } from "@academics/models/class.model";
import { SectionModel } from "@academics/models/section.model";
import { ExamModel } from "@academics/models/exam.model";
import { ResultModel } from "@academics/models/result.model";
import { SubjectModel } from "@academics/models/subject.model";
import SchoolModel from "@academics/models/schools.schema";

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
        then: jest.fn(function (this: any, resolve: any) {
            return Promise.resolve(this.exec()).then(resolve);
        }),
    };
    return query;
};

// Global mock objects
const studentQuery = createMockQuery();
const userQuery = createMockQuery();
const classQuery = createMockQuery();
const sectionQuery = createMockQuery();
const examQuery = createMockQuery();
const resultQuery = createMockQuery();
const schoolQuery = createMockQuery();

jest.mock("@academics/models/student.schema", () => ({
    __esModule: true,
    Student: { findOne: jest.fn(() => studentQuery) },
}));
jest.mock("@iam/models/users.schema", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(() => userQuery),
        findOne: jest.fn(() => userQuery),
    },
}));
jest.mock("@academics/models/class.model", () => ({
    __esModule: true,
    ClassModel: {
        findById: jest.fn(() => classQuery),
        findOne: jest.fn(() => classQuery),
    },
}));
jest.mock("@academics/models/section.model", () => ({
    __esModule: true,
    SectionModel: {
        findById: jest.fn(() => sectionQuery),
        findOne: jest.fn(() => sectionQuery),
    },
}));
jest.mock("@academics/models/exam.model", () => ({
    __esModule: true,
    ExamModel: { find: jest.fn(() => examQuery) },
}));
jest.mock("@academics/models/result.model", () => ({
    __esModule: true,
    ResultModel: { find: jest.fn(() => resultQuery) },
}));
jest.mock("@academics/models/subject.model", () => ({
    __esModule: true,
    SubjectModel: { find: jest.fn(() => createMockQuery()) },
}));
jest.mock("@academics/models/schools.schema", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(() => schoolQuery),
        findOne: jest.fn(() => schoolQuery),
    },
}));
jest.mock("@shared/utils/errorLogger");

describe("Academic StudentController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            params: { studentId: "64eaf47a93a9baf21d6d4a1c" },
            query: { tenantId: "t1", schoolId: "64eaf47a93a9baf21d6d4a1c" },
            user: { id: "u1", tenantId: "t1", schoolId: "s1" }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("getCompleteStudentDetails", () => {
        it("should return student details", async () => {
            studentQuery.exec.mockResolvedValue({ _id: "s1", firstName: "Test", classId: "c1", sectionId: "sc1" });
            userQuery.exec.mockResolvedValue({ _id: "u1", account: { username: "testuser" } });
            classQuery.exec.mockResolvedValue({ _id: "c1", name: "Class 1" });
            sectionQuery.exec.mockResolvedValue({ _id: "sc1", sectionName: "Section A" });
            examQuery.exec.mockResolvedValue([]); // Exams should be an array
            resultQuery.exec.mockResolvedValue([]); // Results should be an array
            schoolQuery.exec.mockResolvedValue({ _id: "s1", tenantId: "t1" });

            await getCompleteStudentDetails(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
