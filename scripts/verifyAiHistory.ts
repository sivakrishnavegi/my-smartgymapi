import mongoose from 'mongoose';
import { AiHistoryService } from '../services/aiHistoryService';
import redis from '../config/redis';
import * as dotenv from 'dotenv';
dotenv.config();

async function verifyAIHistory() {
    try {
        await mongoose.connect(process.env.MONGODB_SECRET_URI as string);
        const sessionId = `test-session-${Date.now()}`;
        const userId = '69764a2a25ffdb4e0b3da4ec';
        const tenantId = 'test-tenant';
        const schoolId = new mongoose.Types.ObjectId().toString();

        console.log('--- Step 1: Saving a chat turn ---');
        await AiHistoryService.saveChatTurn({
            sessionId,
            tenantId,
            schoolId,
            userId,
            userRole: 'student',
            userMessage: 'Hello AI Teacher, explain gravity.',
            assistantMessage: 'Gravity is a force that pulls objects toward each other...'
        });
        console.log('✅ Chat turn saved.');

        console.log('\n--- Step 2: Checking Redis Cache ---');
        const redisKey = `chat_history:${sessionId}`;
        const cached = await redis.lrange(redisKey, 0, -1);
        console.log(`Redis contains ${cached.length} messages.`);
        cached.forEach((m, i) => console.log(`  [${i}] ${m.substring(0, 50)}...`));

        console.log('\n--- Step 3: Verifying Service Retrieval (should come from Redis) ---');
        const history = await AiHistoryService.getRecentHistory(sessionId);
        console.log(`Retrieved ${history.length} messages from service.`);

        console.log('\n--- Step 4: Clearing Redis and Verifying MongoDB Fallback ---');
        await redis.del(redisKey);
        console.log('Redis cache cleared.');

        const historyFromDB = await AiHistoryService.getRecentHistory(sessionId);
        console.log(`Retrieved ${historyFromDB.length} messages from service (should be from MongoDB).`);
        console.log('Content check:', historyFromDB[0].content === 'Hello AI Teacher, explain gravity.' ? '✅ Correct' : '❌ Incorrect');

        console.log('\n--- Verification Complete ---');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await mongoose.disconnect();
        await redis.quit();
    }
}

verifyAIHistory();
