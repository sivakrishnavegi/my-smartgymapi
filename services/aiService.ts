import { aiConfig } from '../config/ai';
import { createApiClient, apiGet, apiPost } from './api/apiClient';
import redis from '../config/redis';
import crypto from 'crypto';

/**
 * Configure the client once for reuse across functional exports.
 */
const client = createApiClient(aiConfig.baseUrl, {
    'Content-Type': 'application/json',
    'x-key': aiConfig.serviceKey
});

/**
 * Verify the connection to the AI microservice.
 */
export const checkAiHealth = async (): Promise<boolean> => {
    try {
        console.log(`[AiService] Checking health at ${aiConfig.baseUrl}/health`);
        await apiGet(client, '/health');
        console.log('[AiService] Connection successful');
        return true;
    } catch (error) {
        console.error('[AiService] Connection error:', error);
        return false;
    }
};

/**
 * Robust AI query functionality with pre-call health check and Redis caching.
 */
export const askAiQuestion = async (payload: any): Promise<any> => {
    // 1. Mandatory Health Check
    const isHealthy = await checkAiHealth();
    if (!isHealthy) {
        throw new Error('AI_SERVICE_UNAVAILABLE');
    }

    // 2. Cache Key Generation
    const payloadString = JSON.stringify(payload);
    const hash = crypto.createHash('md5').update(payloadString).digest('hex');
    const cacheKey = `ai_cache:${hash}`;

    try {
        // 3. Cache Check
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[AiService] Cache Hit for ${cacheKey}`);
            return JSON.parse(cached);
        }

        console.log(`[AiService] Cache Miss for ${cacheKey}. Calling microservice...`);

        // 4. API Call
        const response = await apiPost<any>(client, '/api/v1/rag/query', payload);

        // 5. Caching Result (24h TTL)
        await redis.setex(cacheKey, 86400, JSON.stringify(response));

        return response;
    } catch (error: any) {
        console.error('[AiService] askAiQuestion Error:', error.message);
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
