import { askAi, getAiConfiguration, updateAiConfiguration, chatWithAi } from "@ai/controllers/aiTeacherController";
import { AiConfigModel } from "@ai/models/AiConfig";
import { AiGovernanceConfigModel } from "@ai/models/AiGovernanceConfig.model";
import { AiHistoryService } from "@ai/services/aiHistoryService";
import { askAiQuestion } from "@ai/services/aiService";
import redis from "@shared/config/redis";

// Mock dependencies
jest.mock("@ai/models/AiConfig");
jest.mock("@ai/models/AiGovernanceConfig.model");
jest.mock("@ai/services/aiHistoryService");
jest.mock("@ai/services/aiService");
jest.mock("@shared/config/redis", () => ({
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn()
}));
jest.mock("@shared/utils/errorLogger");
jest.mock("uuid", () => ({ v4: () => "mock-uuid" }));

describe("AiTeacherController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {
                input: { content: "hello" },
                tenantId: "t1",
                schoolId: "s1"
            },
            user: { id: "u1", tenantId: "t1", schoolId: "s1", role: "admin" },
            query: {},
            originalUrl: "/test"
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("askAi", () => {
        it("should process AI question request", async () => {
            (AiConfigModel.findOne as jest.Mock).mockResolvedValue({
                isEnabled: true,
                tokenManagement: { usedThisMonth: 0, monthlyLimit: 1000 }
            });
            (AiGovernanceConfigModel.findOne as jest.Mock).mockResolvedValue({
                globalSystemPrompt: "test",
                teachingStyles: [{ id: "socratic", prompt: "p", isDefault: true }]
            });
            (askAiQuestion as jest.Mock).mockResolvedValue({ answer: "hi", usage: { totalTokens: 10 } });
            (AiConfigModel.findOneAndUpdate as jest.Mock).mockResolvedValue({
                tokenManagement: { usedThisMonth: 10, monthlyLimit: 1000 }
            });

            await askAi(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it("should return 403 if tenant mismatch for non-admin", async () => {
            req.user.role = "user";
            req.body.tenantId = "other";
            await askAi(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe("chatWithAi", () => {
        it("should handle simple chat with mock response", async () => {
            await chatWithAi(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(AiHistoryService.saveChatTurn).toHaveBeenCalled();
        });
    });
});
