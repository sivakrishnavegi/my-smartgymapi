import dotenv from 'dotenv';

dotenv.config();

export const aiConfig = {
    baseUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8002',
    serviceKey: process.env.AI_SERVICE_KEY || 'default-secret-key', // x-key for microservice communication
    xToken: process.env.X_TOKEN || '', // Additional token for security
    ragServiceBaseUrl: process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8002',
};
