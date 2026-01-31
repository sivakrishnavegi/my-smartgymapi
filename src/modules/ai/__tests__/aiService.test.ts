// Need to mock uuid BEFORE importing the service that uses it
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mocking the dependencies
jest.mock("@shared/services/api/apiClient", () => ({
    createApiClient: jest.fn(() => ({})),
    apiGet: jest.fn(),
    apiPost: jest.fn(),
}));

jest.mock("@shared/config/redis", () => ({
    ping: jest.fn(),
    get: jest.fn(),
    setex: jest.fn()
}));

import { checkAiHealth, checkVectorDbHealth, checkRedisHealth } from "@ai/services/aiService";
import { apiGet } from "@shared/services/api/apiClient";
import redis from "@shared/config/redis";

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

describe("AiService - checkVectorDbHealth", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return health data when call succeeds", async () => {
        const mockResponse = { status: "ok", indexes: [] };
        (apiGet as jest.Mock).mockResolvedValue(mockResponse);

        const result = await checkVectorDbHealth();

        expect(result).toEqual(mockResponse);
        expect(apiGet).toHaveBeenCalledWith(expect.anything(), '/api/v1/ai/vector-db-health');
    });

    it("should throw error when call fails", async () => {
        const error = new Error("Vector DB Unavailable");
        (apiGet as jest.Mock).mockRejectedValue(error);

        await expect(checkVectorDbHealth()).rejects.toThrow("Vector DB Unavailable");
    });
});

describe("AiService - checkRedisHealth", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return ok when redis pings successfully", async () => {
        (redis.ping as jest.Mock).mockResolvedValue("PONG");

        const result = await checkRedisHealth();

        expect(result).toEqual({ status: "ok", message: "PONG" });
        expect(redis.ping).toHaveBeenCalled();
    });

    it("should throw error when redis ping fails", async () => {
        (redis.ping as jest.Mock).mockRejectedValue(new Error("Redis Down"));

        await expect(checkRedisHealth()).rejects.toThrow("Redis Down");
    });
});

