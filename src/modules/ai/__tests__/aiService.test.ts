// Need to mock uuid BEFORE importing the service that uses it
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mocking the dependencies
jest.mock("@shared/services/api/apiClient", () => ({
    createApiClient: jest.fn(),
    apiGet: jest.fn(),
    apiPost: jest.fn(),
}));

import { checkAiHealth } from "@ai/services/aiService";
import { apiGet } from "@shared/services/api/apiClient";

describe("AiService - checkAiHealth", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return true when health check succeeds", async () => {
        (apiGet as jest.Mock).mockResolvedValue({ data: { status: "ok" } });

        const result = await checkAiHealth();

        expect(result).toBe(true);
        expect(apiGet).toHaveBeenCalled();
    });

    it("should return false when health check fails", async () => {
        (apiGet as jest.Mock).mockRejectedValue(new Error("Connection failed"));

        const result = await checkAiHealth();

        expect(result).toBe(false);
    });
});
