import { aiConfig } from '../config/ai';
import { ApiClient } from './api/apiClient';

export class AiService {
    private static client = new ApiClient(aiConfig.baseUrl, {
        'Content-Type': 'application/json',
        'x-key': aiConfig.serviceKey
    });

    /**
     * verify the connection to the AI microservice.
     * Tries to hit the health endpoint.
     */
    static async checkHealth(): Promise<boolean> {
        try {
            console.log(`[AiService] Checking health at ${aiConfig.baseUrl}/health`);
            // Assuming health endpoint returns 200 OK on success, data might be irrelevant or { status: 'ok' }
            await this.client.get('/health');
            console.log('[AiService] Connection successful');
            return true;
        } catch (error) {
            console.error('[AiService] Connection error:', error);
            return false;
        }
    }

    /**
     * Generic method to call the AI service.
     */
    static async callService(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST', body?: any): Promise<any> {
        try {
            switch (method) {
                case 'GET':
                    return await this.client.get(endpoint);
                case 'POST':
                    return await this.client.post(endpoint, body);
                case 'PUT':
                    return await this.client.put(endpoint, body);
                case 'PATCH':
                    return await this.client.patch(endpoint, body);
                case 'DELETE':
                    return await this.client.delete(endpoint);
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }
        } catch (error) {
            console.error(`[AiService] Error calling ${endpoint}:`, error);
            throw error;
        }
    }
}
