import { getGovernanceConfig, updateGovernanceConfig, resetGovernanceConfig, getVectorDbHealth, getRedisHealth } from "@ai/controllers/aiGovernanceController";
import { AiGovernanceConfigModel } from "@ai/models/AiGovernanceConfig.model";

// Mock the model
jest.mock("@ai/models/AiGovernanceConfig.model");
// Mock the service
jest.mock("@ai/services/aiService", () => ({
    AiService: {
        checkVectorDbHealth: jest.fn(),
        checkRedisHealth: jest.fn()
    }
}));
import { AiService } from "@ai/services/aiService";

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

    describe("getVectorDbHealth", () => {
        it("should return health data on success", async () => {
            const mockHealth = { status: "ok" };
            (AiService.checkVectorDbHealth as jest.Mock).mockResolvedValue(mockHealth);

            await getVectorDbHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockHealth);
        });

        it("should return 500 on failure", async () => {
            (AiService.checkVectorDbHealth as jest.Mock).mockRejectedValue(new Error("Service Error"));

            await getVectorDbHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "Error fetching Vector DB health"
            }));
        });
    });

    describe("getRedisHealth", () => {
        it("should return health data on success", async () => {
            const mockHealth = { status: "ok", message: "PONG" };
            (AiService.checkRedisHealth as jest.Mock).mockResolvedValue(mockHealth);

            await getRedisHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockHealth);
        });

        it("should return 500 on failure", async () => {
            (AiService.checkRedisHealth as jest.Mock).mockRejectedValue(new Error("Redis Error"));

            await getRedisHealth(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "Error fetching Redis health"
            }));
        });
    });
});
