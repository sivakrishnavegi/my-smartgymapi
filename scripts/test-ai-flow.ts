import { askAiQuestion, checkAiHealth } from '../services/aiService';
import { AiHistoryService } from '../services/aiHistoryService';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import redis from '../config/redis';
import crypto from 'crypto';

dotenv.config();

const testPayload = {
    query: "Explain photosynthesis in 2 sentences.",
    tenant_id: "test-tenant-id",
    school_id: "65b21c4e9f1a2b3c4d5e6f7b",
    context_filters: { subject: "biology" }
};

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function verifyFlow() {
    try {
        console.log("--- Starting AI Flow Verification (Functional & Health Checked) ---");

        // 1. Connect to MongoDB
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        // 2. Health Check Test
        console.log("\n[TEST 0] Testing standalone health check...");
        const healthy = await checkAiHealth();
        console.log(`Service health status: ${healthy ? 'ONLINE' : 'OFFLINE'}`);

        // 3. Clear Cache
        const payloadString = JSON.stringify(testPayload);
        const hash = crypto.createHash('md5').update(payloadString).digest('hex');
        const cacheKey = `ai_cache:${hash}`;
        await redis.del(cacheKey);

        // 4. Integrated Call (Includes Health Check + Caching)
        console.log("\n[TEST 1] Integrated askAiQuestion (Should include auto health check)...");
        const start = Date.now();
        const res = await askAiQuestion(testPayload);
        console.log(`Response time: ${Date.now() - start}ms`);
        console.log(`Answer: ${res.answer.substring(0, 50)}...`);

        // 5. Verify History
        console.log("\n[TEST 2] Verifying History...");
        const { AiChatHistoryModel } = require('../models/aiChatHistory.model');
        const sessionId = `test-session-v2-${Date.now()}`;

        await AiHistoryService.saveChatTurn({
            sessionId,
            tenantId: testPayload.tenant_id,
            schoolId: testPayload.school_id,
            userId: "65b21c4e9f1a2b3c4d5e6f7a",
            userRole: "student",
            subjectId: "biology",
            userMessage: testPayload.query,
            assistantMessage: res.answer,
            usage: res.usage || { totalTokens: 0 }
        });

        const history = await AiChatHistoryModel.findOne({ sessionId });
        if (history) {
            console.log(`✅ SUCCESS: History saved successfully.`);
        } else {
            console.error("❌ FAILURE: History missing.");
        }

        console.log("\n--- Verification Complete ---");

    } catch (error: any) {
        if (error.message === 'AI_SERVICE_UNAVAILABLE') {
            console.error("❌ CAUGHT ERROR: AI Service is down. Health check working correctly.");
        } else {
            console.error("Unexpected Error:", error.message);
        }
    } finally {
        await mongoose.disconnect();
        redis.disconnect();
        process.exit(0);
    }
}

verifyFlow();
