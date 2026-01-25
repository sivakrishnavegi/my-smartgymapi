import { Request, Response } from "express";
import redis from "../config/redis";
import { v4 as uuidv4 } from "uuid";

// Mock Python Service URL (Env variable in prod)
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// --- Rate Limiting Helper (Simple Redis implementation) ---
const checkRateLimit = async (userId: string, limit: number, windowSeconds: number): Promise<boolean> => {
    const key = `rate_limit:${userId}`;
    const current = await redis.incr(key);
    if (current === 1) {
        await redis.expire(key, windowSeconds);
    }
    return current <= limit;
};

// --- Chat Interface ---
import { AiChatHistoryModel } from "../models/aiChatHistory.model";

export const chatWithAi = async (req: Request, res: Response) => {
    try {
        const { message, subjectId, topicId, sessionId: reqSessionId } = req.body;
        // @ts-ignore
        const userId = req.user._id; 
        // @ts-ignore
        const userRole = req.user.userType;
        // @ts-ignore
        const userClass = req.user.enrollment?.classId;
        // @ts-ignore
        const userSection = req.user.enrollment?.sectionId;
        // @ts-ignore
        const tenantId = req.user.tenantId;
        // @ts-ignore
        const schoolId = req.user.schoolId;

        // 1. Rate Limiting
        const isAllowed = await checkRateLimit(userId.toString(), 20, 60);
        if (!isAllowed) {
            return res.status(429).json({ message: "Too many requests. Please try again later." });
        }

        // 2. Generate or Use Session ID
        const sessionId = reqSessionId || uuidv4();

        // 3. Mock Forwarding to Python Microservice
        console.log(`[AI Proxy] Forwarding to Python: User=${userId}, Msg="${message}"`);
        
        // 4. Response (Mocking RAG response)
        const mockResponse = {
            answer: `[AI Teacher] I see you are asking about "${message}". Since you are in Class ${userClass}, I will explain this simply...`,
            sources: ["Chapter 3: Force and Laws of Motion"],
            sessionId
        };

        // 5. Save to History (Redis - Short Term)
        const historyKey = `chat_history:${userId}:${sessionId}`;
        await redis.lpush(historyKey, JSON.stringify({ role: "user", content: message }));
        await redis.lpush(historyKey, JSON.stringify({ role: "assistant", content: mockResponse.answer }));
        await redis.ltrim(historyKey, 0, 19); 
        await redis.expire(historyKey, 3600); // Expire after 1 hour of inactivity

        // 6. Save to History (MongoDB - Long Term Persistence)
        // Upsert the session document
        await AiChatHistoryModel.findOneAndUpdate(
            { sessionId, tenantId, schoolId },
            {
                $setOnInsert: {
                    tenantId,
                    schoolId,
                    userId,
                    userRole,
                    classId: userClass,
                    sectionId: userSection,
                    subjectId, // optional context from starting the chat
                    topicId,
                    title: message.substring(0, 50) + "..." // Simple title generation
                },
                $push: {
                    messages: [
                        { role: "user", content: message, timestamp: new Date() },
                        { role: "assistant", content: mockResponse.answer, timestamp: new Date() }
                    ]
                }
            },
            { upsert: true, new: true }
        );

        res.status(200).json(mockResponse);

    } catch (error: any) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ message: "Error processing AI request" });
    }
};

// --- Knowledge Ingestion ---
import { ingestionQueue } from "../config/queue";

export const uploadKnowledge = async (req: Request, res: Response) => {
    try {
        // Assume Multer middleware handled file upload to req.file
        // @ts-ignore
        // if (!req.file) ...

        const { classId, subjectId, chapter } = req.body;

        // BullMQ Job
        const jobName = `ingest-${subjectId}-${Date.now()}`;
        const job = await ingestionQueue.add(jobName, {
            // filePath: req.file.path,
            metadata: { classId, subjectId, chapter },
            timestamp: Date.now()
        });

        res.status(202).json({
            message: "File accepted for processing",
            jobId: job.id,
            statusUrl: `/api/ai-teacher/knowledge/status/${job.id}`
        });

    } catch (error: any) {
        console.error("Ingestion Error:", error);
        res.status(500).json({ message: "Error starting ingestion" });
    }
};

export const getIngestionStatus = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;
        const job = await ingestionQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        const state = await job.getState(); // completed, failed, active, waiting
        const result = job.returnvalue;
        const progress = job.progress;

        res.status(200).json({
            jobId,
            state,
            progress: typeof progress === 'number' ? progress : 0,
            result,
            error: job.failedReason
        });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching status" });
    }
};
