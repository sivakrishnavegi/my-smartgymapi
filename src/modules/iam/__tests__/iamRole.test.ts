import { getRoles, createRole } from "@iam/controllers/roleController";
import { RoleModel as Role } from "@iam/models/roles.schema";

// Mock dependencies
jest.mock("@iam/models/roles.schema");

describe("IAM RoleController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            query: { tenantId: "t1", schoolId: "s1" },
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("getRoles", () => {
        it("should return roles for tenant", async () => {
            (Role.find as jest.Mock).mockResolvedValue([]);
            await getRoles(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe("createRole", () => {
        it("should create new role", async () => {
            req.body = { name: "admin", tenantId: "t1", schoolId: "s1" };
            (Role.findOne as jest.Mock).mockResolvedValue(null);
            (Role.create as jest.Mock).mockResolvedValue({ name: "admin" });

            await createRole(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });
});
