import { aiIngestionWebhook } from "@ai/controllers/aiWebhookController";
import { AiDocumentModel } from "@ai/models/AiDocument.model";
import { cacheService } from "@shared/services/cacheService";

// Mock dependencies
jest.mock("@ai/models/AiDocument.model");
jest.mock("@shared/services/cacheService");
jest.mock("@shared/utils/errorLogger");

describe("AiWebhookController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: { document_id: "rag-1", status: "completed", vector_ids: ["v1"] }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("aiIngestionWebhook", () => {
        it("should process webhook and update document", async () => {
            const mockDoc = {
                tenantId: "t1",
                schoolId: { toString: () => "s1" },
                save: jest.fn()
            };
            (AiDocumentModel.findOne as jest.Mock).mockResolvedValue(mockDoc);

            await aiIngestionWebhook(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(mockDoc.save).toHaveBeenCalled();
            expect(cacheService.clearPattern).toHaveBeenCalled();
        });

        it("should return 404 if document not found", async () => {
            (AiDocumentModel.findOne as jest.Mock).mockResolvedValue(null);
            await aiIngestionWebhook(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("should return 400 if missing id or status", async () => {
            req.body = {};
            await aiIngestionWebhook(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
