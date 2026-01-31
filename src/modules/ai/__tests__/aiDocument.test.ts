import { ingestDocument, registerDocument, getDocuments, deleteDocument, getDocumentUrl, syncDocuments } from "@ai/controllers/aiDocumentController";
import { AiDocumentService } from "@ai/services/aiDocumentService";
import { AwsService } from "@shared/services/awsService";
import { AiDocumentModel } from "@ai/models/AiDocument.model";
import { cacheService } from "@shared/services/cacheService";

// Mock dependencies
jest.mock("@ai/services/aiDocumentService");
jest.mock("@shared/services/awsService");
jest.mock("@ai/models/AiDocument.model");
jest.mock("@shared/services/cacheService");
jest.mock("@shared/utils/errorLogger");
jest.mock("@shared/utils/pagination", () => ({
    getPagination: jest.fn(() => ({ page: 1, limit: 10, skip: 0 })),
    buildPaginationResponse: jest.fn(() => ({ totalPages: 1, currentPage: 1 }))
}));

describe("AiDocumentController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            file: {
                originalname: "test.pdf",
                buffer: Buffer.from("test content"),
                mimetype: "application/pdf",
                size: 100
            },
            body: { tenantId: "tenant-1", schoolId: "507f1f77bcf86cd799439011" },
            params: { id: "507f1f77bcf86cd799439012" },
            query: { tenantId: "tenant-1" },
            user: { _id: "507f1f77bcf86cd799439013" }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("ingestDocument", () => {
        it("should ingest document successfully", async () => {
            (AiDocumentService.findExistingDuplicate as jest.Mock).mockResolvedValue(null);
            (AiDocumentService.registerDocument as jest.Mock).mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });
            (AiDocumentService.callToRagMicroservice as jest.Mock).mockResolvedValue({ document_id: "rag-1", status: "processing" });

            await ingestDocument(req, res);

            expect(res.status).toHaveBeenCalledWith(202);
            expect(AwsService.uploadBuffer).toHaveBeenCalled();
            expect(AiDocumentService.callToRagMicroservice).toHaveBeenCalled();
        });

        it("should handle duplicate documents", async () => {
            (AiDocumentService.findExistingDuplicate as jest.Mock).mockResolvedValue({ _id: "507f1f77bcf86cd799439011", ragDocumentId: "rag-1", metadata: {}, schoolId: { toString: () => "507f1f77bcf86cd799439011" } });
            (AiDocumentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });

            await ingestDocument(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Duplicate/) }));
        });
    });

    describe("getDocuments", () => {
        it("should return list of documents", async () => {
            (AiDocumentService.getDocuments as jest.Mock).mockResolvedValue({ documents: [], total: 0 });

            await getDocuments(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Documents fetched successfully" }));
        });
    });

    describe("deleteDocument", () => {
        it("should delete document and clear cache", async () => {
            (AiDocumentService.deleteDocument as jest.Mock).mockResolvedValue({ tenantId: "t1", schoolId: "s1" });

            await deleteDocument(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(cacheService.clearPattern).toHaveBeenCalled();
        });
    });

    describe("syncDocuments", () => {
        it("should sync processing documents", async () => {
            (AiDocumentModel.find as jest.Mock).mockResolvedValue([{ _id: "507f1f77bcf86cd799439011", ragDocumentId: "rag-1", tenantId: "t1", schoolId: { toString: () => "507f1f77bcf86cd799439011" } }]);
            (AiDocumentService.getRagStatus as jest.Mock).mockResolvedValue({ status: "completed", vector_ids: ["v1"] });

            await syncDocuments(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(AiDocumentService.updateStatus).toHaveBeenCalled();
        });
    });
});
