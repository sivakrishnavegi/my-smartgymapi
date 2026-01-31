import { createClass, getClasses } from "@academics/controllers/classController";
import { ClassModel as Class } from "@academics/models/class.model";

// Mock dependencies
const mockQuery: any = {
    exec: jest.fn().mockResolvedValue([]),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    then: jest.fn(function (this: any, resolve: any) {
        return Promise.resolve(this.exec()).then(resolve);
    }),
};

jest.mock("@academics/models/class.model", () => ({
    __esModule: true,
    ClassModel: {
        find: jest.fn(() => mockQuery),
        findOne: jest.fn(() => mockQuery),
        create: jest.fn().mockResolvedValue({ name: "10th" }),
        countDocuments: jest.fn().mockResolvedValue(0),
    },
}));
jest.mock("@academics/models/schools.schema", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(() => mockQuery),
        findById: jest.fn().mockResolvedValue({ _id: "64eaf47a93a9baf21d6d4a1c", tenantId: "t1" }),
    },
}));
jest.mock("@shared/utils/errorLogger");

describe("Academic ClassController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.exec.mockReset();
        req = {
            body: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("getClasses", () => {
        it("should list all classes", async () => {
            mockQuery.exec.mockResolvedValue([]);
            await getClasses(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe("createClass", () => {
        it("should create class", async () => {
            req.body = { className: "10th", tenantId: "t1", schoolId: "64eaf47a93a9baf21d6d4a1c" };
            // For generateUniqueCode
            mockQuery.exec.mockResolvedValueOnce({ _id: "school1" }) // School check
                .mockResolvedValueOnce(null); // Code uniqueness check

            await createClass(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });
});
