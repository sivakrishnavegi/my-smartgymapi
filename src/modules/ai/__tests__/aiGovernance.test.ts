import { getGovernanceConfig, updateGovernanceConfig, resetGovernanceConfig } from "@ai/controllers/aiGovernanceController";
import { AiGovernanceConfigModel } from "@ai/models/AiGovernanceConfig.model";

// Mock the model
jest.mock("@ai/models/AiGovernanceConfig.model");

describe("AiGovernanceController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { tenantId: "tenant-1", schoolId: "school-1", role: "admin" },
            query: {},
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("getGovernanceConfig", () => {
        it("should return existing config", async () => {
            const mockConfig = { tenantId: "tenant-1", schoolId: "school-1" };
            (AiGovernanceConfigModel.findOne as jest.Mock).mockResolvedValue(mockConfig);

            await getGovernanceConfig(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockConfig });
        });

        it("should return default config if none exists", async () => {
            (AiGovernanceConfigModel.findOne as jest.Mock).mockResolvedValue(null);

            await getGovernanceConfig(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it("should return 403 if unauthorized", async () => {
            req.user.role = "user";
            req.query.tenantId = "other-tenant";

            await getGovernanceConfig(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: "Unauthorized." });
        });
    });

    describe("updateGovernanceConfig", () => {
        it("should update and return config", async () => {
            const mockUpdatedConfig = { globalSystemPrompt: "test" };
            (AiGovernanceConfigModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedConfig);

            req.body = { globalSystemPrompt: "test" };
            await updateGovernanceConfig(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "AI Governance configuration updated"
            }));
        });
    });

    describe("resetGovernanceConfig", () => {
        it("should delete and return default config", async () => {
            (AiGovernanceConfigModel.findOneAndDelete as jest.Mock).mockResolvedValue({});

            await resetGovernanceConfig(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: "AI Governance configuration restored to defaults"
            }));
        });
    });
});
