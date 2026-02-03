import { configureSchool } from "../../../../controllers/tenantController";
import School from "../../academics/models/schools.schema";
import Tenant from "../../academics/models/tenant.schema";

// Mock dependencies
const mockQuery: any = {
    exec: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn(function (this: any, resolve: any, reject: any) {
        return this.exec().then(resolve, reject);
    }),
};

// Mock School Model
jest.mock("../../academics/models/schools.schema", () => {
    const mockModel: any = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "s1" }),
    }));
    mockModel.findOne = jest.fn(() => mockQuery);
    mockModel.findOneAndUpdate = jest.fn(() => mockQuery);
    return {
        __esModule: true,
        default: mockModel,
    };
});

// Mock Tenant Model
jest.mock("../../academics/models/tenant.schema", () => {
    const mockModel: any = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "t1" }),
    }));
    mockModel.findOne = jest.fn(() => mockQuery);
    mockModel.findOneAndUpdate = jest.fn(() => mockQuery);
    return {
        __esModule: true,
        default: mockModel,
    };
});

jest.mock("../../../../utils/errorLogger");
jest.mock("../../../../models/errorLog.schema", () => ({ ErrorLog: {} }));

describe("Tenant School Configuration", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.exec.mockReset(); // Reset mockQuery behavior

        req = {
            headers: {
                "x-tenant-id": "test-tenant",
                "x-school-id": "test-school",
                "x-api-key": "sk_live_test"
            },
            body: {
                schoolName: "Updated School",
                address: "New Address",
                agreedToTerms: true
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    it("should configure school successfully", async () => {
        // 1. Tenant findOne (validation)
        // 2. School findOneAndUpdate (update)
        // 3. Tenant findOneAndUpdate (update status)
        mockQuery.exec
            .mockResolvedValueOnce({ tenantId: "test-tenant", domain: "localhost" }) // Tenant found
            .mockResolvedValueOnce({ _id: "test-school", name: "Updated School" }) // School updated
            .mockResolvedValueOnce({ tenantId: "test-tenant" }); // Tenant status updated

        await configureSchool(req, res);

        expect(School.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: "test-school", tenantId: "test-tenant" },
            expect.objectContaining({ schoolName: "Updated School" }),
            { new: true }
        );

        expect(Tenant.findOneAndUpdate).toHaveBeenCalledWith(
            { tenantId: "test-tenant" },
            {
                isSchoolSetupCompleted: true,
                isSassSetupCompleted: true,
                updatedAt: expect.any(Date)
            }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true
        }));
    });

    it("should return 404 if school not found", async () => {
        // 1. Tenant found
        // 2. School not found (null)
        mockQuery.exec
            .mockResolvedValueOnce({ tenantId: "test-tenant" })
            .mockResolvedValueOnce(null);

        await configureSchool(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: "School not found or does not belong to this tenant"
        }));
    });

    it("should return 400 if x-api-key header is missing", async () => {
        delete req.headers["x-api-key"];

        await configureSchool(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining("x-api-key are mandatory")
        }));
    });

    it("should return 400 if domain mismatch", async () => {
        req.headers["x-tenant-domain"] = "other.com";

        mockQuery.exec.mockResolvedValueOnce({
            tenantId: "test-tenant",
            domain: "localhost"
        }); // Tenant found but domain mismatch

        await configureSchool(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining("Domain Mismatch")
        }));
    });

    it("should handle errors gracefully", async () => {
        const error = new Error("Database error");
        // Make the very first call fail to ensure 500
        mockQuery.exec.mockRejectedValue(error);

        await configureSchool(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
