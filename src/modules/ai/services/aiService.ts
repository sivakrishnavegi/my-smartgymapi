import { aiConfig } from "@shared/config/ai";
import { createApiClient, apiGet, apiPost } from "@shared/services/api/apiClient";
import redis from "@shared/config/redis";
import crypto from 'crypto';
import { AiLog } from "@ai/models/aiLog.model";
import { v4 as uuidv4 } from 'uuid';

/**
 * Configure the client once for reuse across functional exports.
 */
const client = createApiClient(aiConfig.baseUrl, {
    'Content-Type': 'application/json',
    'x-key': aiConfig.serviceKey,
    'X-TOKEN': aiConfig.xToken
});

/**
 * Verify the connection to the AI microservice.
 */
export const checkAiHealth = async (): Promise<boolean> => {
    try {
        await apiGet(client, '/health');
        return true;
    } catch (error) {
        console.error('[AiService] Connection error:', error);
        return false;
    }
};

/**
 * Robust AI query functionality with pre-call health check, Redis caching, and logging.
 */
export const askAiQuestion = async (params: {
    payload: any;
    tenantId?: string;
    userId?: string;
    route?: string;
    requestId?: string;
}): Promise<any> => {
    const { payload, tenantId, userId, route, requestId = uuidv4() } = params;
    const startTime = Date.now();

    // 1. Mandatory Health Check
    const isHealthy = await checkAiHealth();
    if (!isHealthy) {
        const err = new Error('AI_SERVICE_UNAVAILABLE');
        // Log the failure to connect
        await AiLog.create({
            requestId,
            tenantId,
            userId,
            route,
            to: `${aiConfig.baseUrl}/health`,
            method: 'GET',
            error: 'Health check failed - Service Unavailable',
            latency: Date.now() - startTime
        });
        throw err;
    }

    // 2. Cache Key Generation
    const payloadString = JSON.stringify(payload);
    const hash = crypto.createHash('md5').update(payloadString).digest('hex');
    const cacheKey = `ai_cache:${hash}`;

    try {
        // 3. Cache Check
        const isCacheEnabled = process.env.AI_CACHE_ENABLED === 'true';
        let cached = null;

        if (isCacheEnabled) {
            cached = await redis.get(cacheKey);
        }

        if (cached) {
            const response = JSON.parse(cached);

            // Log the cache hit
            await AiLog.create({
                requestId,
                tenantId,
                userId,
                route,
                to: 'REDIS_CACHE',
                method: 'CACHE_GET',
                payload,
                response,
                latency: Date.now() - startTime
            });

            return response;
        }


        // 4. API Call
        const response = await apiPost<any>(client, '/api/v1/rag/query', payload, {}, requestId);

        // 5. Caching Result (24h TTL)
        if (isCacheEnabled) {
            await redis.setex(cacheKey, 86400, JSON.stringify(response));
        }

        // 6. Success Log
        await AiLog.create({
            requestId,
            tenantId,
            userId,
            route,
            to: `${aiConfig.baseUrl}/api/v1/rag/query`,
            method: 'POST',
            payload,
            response,
            statusCode: 200,
            latency: Date.now() - startTime
        });

        return response;
    } catch (error: any) {
        const latency = Date.now() - startTime;
        console.error('[AiService] askAiQuestion Error:', error.message);

        // Log Error in AiLog
        await AiLog.create({
            requestId,
            tenantId,
            userId,
            route,
            to: `${aiConfig.baseUrl}/api/v1/rag/query`,
            method: 'POST',
            payload,
            error: error.message,
            statusCode: error.response?.status || 500,
            latency
        });

        throw error;
    }
};

/**
 * Generic call wrapper for other microservice interactions.
 */
export const callAiMicroservice = async (
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
    body?: any
): Promise<any> => {
    try {
        const config = { method, url: endpoint, data: body };
        const response = await client.request(config);
        return response.data;
    } catch (error: any) {
        console.error(`[AiService] Error calling ${endpoint}:`, error.message);
        throw error;
    }
};

/**
 * Check health of the Vector Database.
 */
export const checkVectorDbHealth = async (): Promise<any> => {
    try {
        const response = await apiGet(client, '/api/v1/ai/vector-db-health');
        return response;
    } catch (error: any) {
        console.error('[AiService] Vector DB Health Check error:', error.message);
        throw error;
    }
};

/**
 * Check health of the Redis Cache.
 */
export const checkRedisHealth = async (): Promise<any> => {
    try {
        const result = await redis.ping();
        return { status: "ok", message: result };
    } catch (error: any) {
        console.error('[AiService] Redis connection error:', error.message);
        throw error;
    }
};

/**
 * Grouped AI Service exports for consistent usage across the application.
 */
export const AiService = {
    checkHealth: checkAiHealth,
    checkVectorDbHealth,
    checkRedisHealth,
    askAiQuestion,
    callAiMicroservice
};
