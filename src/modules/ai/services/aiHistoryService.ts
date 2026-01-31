import redis from "@shared/config/redis";
import { AiChatHistoryModel, IMessage } from "@ai/models/aiChatHistory.model";
import { Types } from "mongoose";

export class AiHistoryService {
    private static CACHE_TTL = 3600; // 1 hour
    private static MAX_CACHE_MESSAGES = 20;

    /**
     * Save a new pair of messages (user & assistant) to both Redis and MongoDB.
     */
    static async saveChatTurn(params: {
        sessionId: string;
        tenantId: string;
        schoolId: string;
        userId: string;
        userRole: string;
        subjectId?: string;
        topicId?: string;
        userMessage: string;
        assistantMessage: string;
        usage?: any;
        meta?: Record<string, any>;
    }) {
        const { sessionId, tenantId, schoolId, userId, userRole, subjectId, topicId, userMessage, assistantMessage, usage, meta } = params;

        const messages: IMessage[] = [
            { role: "user", content: userMessage, timestamp: new Date() },
            { role: "assistant", content: assistantMessage, usage, timestamp: new Date() }
        ];

        // 1. Save to Redis (High Speed Cache)
        const cacheKey = `chat_history:${sessionId}`;
        try {
            for (const msg of messages) {
                await redis.rpush(cacheKey, JSON.stringify(msg));
            }
            await redis.ltrim(cacheKey, -this.MAX_CACHE_MESSAGES, -1);
            await redis.expire(cacheKey, this.CACHE_TTL);
        } catch (err) {
            console.error("[AiHistoryService] Redis Save Error:", err);
        }

        // 2. Save to MongoDB (Permanent Storage)
        await AiChatHistoryModel.findOneAndUpdate(
            { sessionId, tenantId, schoolId },
            {
                $setOnInsert: {
                    tenantId,
                    schoolId,
                    userId: new Types.ObjectId(userId),
                    userRole,
                    subjectId,
                    topicId,
                    meta,
                    title: userMessage.substring(0, 50) + "..."
                },
                $push: {
                    messages: { $each: messages }
                }
            },
            { upsert: true, new: true }
        );
    }

    /**
     * Retrieve recent history from Redis, falling back to MongoDB.
     */
    static async getRecentHistory(sessionId: string): Promise<IMessage[]> {
        const cacheKey = `chat_history:${sessionId}`;

        try {
            // 1. Try Redis
            const cachedMessages = await redis.lrange(cacheKey, 0, -1);
            if (cachedMessages && cachedMessages.length > 0) {
                return cachedMessages.map(m => JSON.parse(m));
            }

            // 2. Fallback to MongoDB
            const history = await AiChatHistoryModel.findOne({ sessionId }).lean();
            if (history && history.messages.length > 0) {
                const messages = history.messages.slice(-this.MAX_CACHE_MESSAGES);

                // Backfill Redis
                for (const msg of messages) {
                    await redis.rpush(cacheKey, JSON.stringify(msg));
                }
                await redis.expire(cacheKey, this.CACHE_TTL);

                return messages;
            }
        } catch (err) {
            console.error("[AiHistoryService] Retrieval Error:", err);
        }

        return [];
    }

    /**
     * Clear session history (e.g., on manual reset).
     */
    static async clearSession(sessionId: string) {
        const cacheKey = `chat_history:${sessionId}`;
        await redis.del(cacheKey);
    }
}
