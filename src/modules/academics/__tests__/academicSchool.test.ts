import { createSchool, listSchools } from "@academics/controllers/schoolController";
import School from "@academics/models/schools.schema";

// Mock dependencies
const mockQuery: any = {
    exec: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnThis(),
    then: jest.fn(function (this: any, resolve: any) {
        return Promise.resolve(this.exec()).then(resolve);
    }),
};

// Use a mock function for the model to support constructor and static methods
jest.mock("@academics/models/schools.schema", () => {
    const mockModel: any = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "s1", name: "Test School" }),
    }));
    mockModel.findOne = jest.fn(() => mockQuery);
    mockModel.find = jest.fn(() => mockQuery);
    mockModel.findById = jest.fn(() => mockQuery);
    mockModel.findByIdAndUpdate = jest.fn(() => mockQuery);
    mockModel.findByIdAndDelete = jest.fn(() => mockQuery);
    return {
        __esModule: true,
        default: mockModel,
    };
});

jest.mock("@academics/models/tenant.schema", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn().mockResolvedValue({ tenantId: "t1" }),
    },
}));
jest.mock("@shared/utils/errorLogger");

describe("Academic SchoolController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.exec.mockReset();
        req = {
            body: {},
            user: { id: "admin-123" }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("createSchool", () => {
        it("should register school successfully", async () => {
            req.body = {
                tenantId: "t1",
                name: "Test School",
                address: "Add",
                contact: { phone: "1234567890", email: "s@test.com" }
            };
            mockQuery.exec.mockResolvedValue(null);

            await createSchool(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should return 409 if school already exists", async () => {
            req.body = { tenantId: "t1", name: "Test School", address: "Add" };
            mockQuery.exec.mockResolvedValue({ _id: "s1" });

            await createSchool(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
        });
    });
});
