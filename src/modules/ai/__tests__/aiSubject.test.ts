import { getControlTower, toggleAiStatus } from "@ai/controllers/aiSubjectController";
import * as AiSubjectService from "@ai/services/aiSubjectService";
import { cacheService } from "@shared/services/cacheService";

// Mock dependencies
jest.mock("@ai/services/aiSubjectService");
jest.mock("@shared/services/cacheService");
jest.mock("@shared/utils/pagination", () => ({
    getPagination: jest.fn(() => ({ page: 1, limit: 10, skip: 0 })),
    buildPaginationResponse: jest.fn(() => ({ totalPages: 1, currentPage: 1 }))
}));

describe("AiSubjectController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            query: { tenantId: "tenant-1", schoolId: "school-1" },
            params: { subjectId: "subject-1" },
            body: { tenantId: "tenant-1", schoolId: "school-1", isActive: true }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("getControlTower", () => {
        it("should return control tower data", async () => {
            const mockData = { data: [], total: 0 };
            (AiSubjectService.getControlTowerList as jest.Mock).mockResolvedValue(mockData);

            await getControlTower(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Control Tower data fetched successfully"
            }));
        });

        it("should return 400 if tenantId or schoolId is missing", async () => {
            req.query = {};
            await getControlTower(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe("toggleAiStatus", () => {
        it("should toggle status and clear cache", async () => {
            (AiSubjectService.toggleSubjectAi as jest.Mock).mockResolvedValue({ id: "subject-1", isActive: true });

            await toggleAiStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(cacheService.clearPattern).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "AI Status updated to Active"
            }));
        });
    });
});
