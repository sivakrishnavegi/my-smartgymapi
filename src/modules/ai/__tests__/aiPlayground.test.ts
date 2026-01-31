// Mock uuid before imports to avoid ESM issues
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-123'),
}));

import { handleChat } from "@ai/controllers/aiPlaygroundController";
import { AiService } from "@ai/services/aiService";
import { AiChatHistoryModel } from "@ai/models/AiChatHistory.model";
import { SubjectModel } from "@academics/models/subject.model";

// Mock dependencies
jest.mock("@ai/services/aiService");
jest.mock("@ai/models/AiChatHistory.model");
jest.mock("@academics/models/subject.model");
jest.mock("@shared/utils/errorLogger");

describe("AiPlaygroundController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            headers: {
                "x-request-id": "mock-req-id-1"
            },
            body: {
                question: "What is the syllabus for mid-terms?",
                classId: "507f1f77bcf86cd799439011",
                sectionId: "507f1f77bcf86cd799439012",
                subjectId: "507f1f77bcf86cd799439013"
            },
            user: {
                id: "507f1f77bcf86cd799439015",
                tenantId: "tenant-123",
                schoolId: "507f1f77bcf86cd799439016",
                email: "test@example.com",
                role: "student"
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        // Mock Chat History save
        (AiChatHistoryModel.findOne as jest.Mock).mockResolvedValue(null);
        (AiChatHistoryModel as unknown as jest.Mock).mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(true),
            messages: [],
            _id: "history-123",
            title: "What is the syllabus..."
        }));

        // Mock Subject
        (SubjectModel.findById as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                name: "Science",
                code: "SCI101"
            })
        });
    });

    describe("handleChat", () => {
        it("should call AI service with correct payload matching user requirements", async () => {
            const mockAiResponse = {
                answer: "Here is the syllabus...",
                sources: ["Verified School Documents"],
                confidence_score: 0.62,
                context: [{ score: 0.62, text: "Some context" }]
            };
            (AiService.askAiQuestion as jest.Mock).mockResolvedValue(mockAiResponse);

            await handleChat(req, res);

            expect(res.status).toHaveBeenCalledWith(200);

            // Verify specific payload structure requested by user
            expect(AiService.askAiQuestion).toHaveBeenCalledWith(expect.objectContaining({
                payload: expect.objectContaining({
                    query: "What is the syllabus for mid-terms?",
                    tenant_id: "tenant-123",
                    school_id: "507f1f77bcf86cd799439016",
                    class_id: "507f1f77bcf86cd799439011",
                    section_id: "507f1f77bcf86cd799439012",
                    subject_id: "507f1f77bcf86cd799439013",
                    user_id: "507f1f77bcf86cd799439015"
                }),
                requestId: "mock-req-id-1"
            }));

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    response: "Here is the syllabus...",
                    subjectName: "Science",
                    subjectCode: "SCI101",
                    sources: ["Verified School Documents"],
                    confidenceScore: 0.62,
                    context: expect.any(Array)
                })
            }));
        });

        it("should handle 500 error from service gracefully", async () => {
            (AiService.askAiQuestion as jest.Mock).mockRejectedValue(new Error("AI Down"));

            await handleChat(req, res);

            // Controller catches error and returns a polite message instead of crashing
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    response: "I'm sorry, I encountered an error while processing your request."
                })
            }));
        });

        it("should return 500 and requestId on unexpected error", async () => {
            // Force an error in the initial DB call to trigger outer catch block
            (AiChatHistoryModel.findOne as jest.Mock).mockRejectedValue(new Error("DB Explosion"));

            await handleChat(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Internal Server Error",
                requestId: "mock-req-id-1"
            }));
        });
    });
});
