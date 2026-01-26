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

// --- AI SaaS & Chat Implementation ---
import { AiConfigModel } from "../models/AiConfig";
import { AiHistoryService } from "../services/aiHistoryService";
import { askAiQuestion, checkAiHealth } from "../services/aiService";

/**
 * Industry-standard AI query endpoint with SaaS billing.
 * @route POST /api/ai-teacher/ask
 */
export const askAi = async (req: Request, res: Response) => {
    try {
        const {
            subject,
            input,
            context,
            options,
            client_meta,
            tenantId: payloadTenantId,
            schoolId: payloadSchoolId,
            sessionId: reqSessionId
        } = req.body;

        const user = (req as any).user;
        const userId = user.id || user._id;
        const tenantId = payloadTenantId || user.tenantId;
        const schoolId = payloadSchoolId || user.schoolId;

        // 1. Check AI Configuration & Subscription
        const aiConfig = await AiConfigModel.findOne({ tenantId, schoolId });
        if (!aiConfig || !aiConfig.isEnabled) {
            return res.status(403).json({
                success: false,
                message: "AI Teacher service is not enabled for this school. Please contact support."
            });
        }

        // 2. Check Token Limits
        if (aiConfig.tokenManagement.usedThisMonth >= aiConfig.tokenManagement.monthlyLimit) {
            return res.status(403).json({
                success: false,
                message: "Monthly AI token limit reached. Please upgrade your plan."
            });
        }

        // 3. Prepare Payload for FastAPI (Updated to match real service schema)
        const sessionId = reqSessionId || uuidv4();
        const pythonPayload = {
            query: input.content,
            tenant_id: tenantId,
            school_id: schoolId,
            context_filters: {
                subject,
                userRole: user.role,
                ...context
            }
        };

        // 4. Call AI Service (Internal Health Check & Redis Caching)
        let aiResponse;
        try {
            aiResponse = await askAiQuestion(pythonPayload);
        } catch (err: any) {
            if (err.message === 'AI_SERVICE_UNAVAILABLE') {
                return res.status(503).json({
                    success: false,
                    message: "AI microservice is currently down for maintenance. Please try again in few minutes."
                });
            }
            throw err;
        }

        // 5. Update Usage (Atomic) and History (via Service)
        const [updatedConfig] = await Promise.all([
            AiConfigModel.findOneAndUpdate(
                { tenantId, schoolId },
                {
                    $inc: {
                        "tokenManagement.usedThisMonth": aiResponse.usage?.totalTokens || 0,
                        "tokenManagement.totalUsed": aiResponse.usage?.totalTokens || 0
                    }
                },
                { new: true }
            ),
            AiHistoryService.saveChatTurn({
                sessionId,
                tenantId,
                schoolId,
                userId: userId.toString(),
                userRole: user.role,
                subjectId: subject,
                userMessage: input.content,
                assistantMessage: aiResponse.answer,
                usage: aiResponse.usage
            })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                ...aiResponse,
                remainingTokens: updatedConfig ? updatedConfig.tokenManagement.monthlyLimit - updatedConfig.tokenManagement.usedThisMonth : 0
            }
        });

    } catch (error: any) {
        console.error("AI Ask Error:", error);
        res.status(500).json({ success: false, message: "Error processing AI request" });
    }
};

/**
 * Get AI configuration for the school (Admins only).
 * @route GET /api/ai-teacher/config
 */
export const getAiConfiguration = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { tenantId: queryTenantId, schoolId: querySchoolId } = req.query;

        const tenantId = queryTenantId || user.tenantId;
        const schoolId = querySchoolId || user.schoolId;

        // Security: Ensure user is only accessing their own tenant
        if (tenantId !== user.tenantId) {
            return res.status(403).json({ success: false, message: "Unauthorized tenant access." });
        }

        const config = await AiConfigModel.findOne({ tenantId, schoolId });

        if (!config) {
            return res.status(404).json({ success: false, message: "AI Configuration not found for this school." });
        }

        res.status(200).json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Error fetching AI configuration" });
    }
};

/**
 * Update or Create AI configuration for the school (Admins only).
 * @route POST /api/ai-teacher/config
 */
export const updateAiConfiguration = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { isEnabled, subscription, tokenManagement, config, tenantId: bodyTenantId, schoolId: bodySchoolId } = req.body;

        const tenantId = bodyTenantId || user.tenantId;
        const schoolId = bodySchoolId || user.schoolId;

        // Security: Ensure user is only accessing their own tenant
        if (tenantId !== user.tenantId) {
            return res.status(403).json({ success: false, message: "Unauthorized tenant access." });
        }

        const updatedConfig = await AiConfigModel.findOneAndUpdate(
            { tenantId, schoolId },
            {
                $set: {
                    isEnabled,
                    subscription,
                    tokenManagement,
                    config,
                    updatedAt: new Date()
                }
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "AI Configuration updated successfully",
            data: updatedConfig
        });
    } catch (error: any) {
        console.error("Update AI Config Error:", error);
        res.status(500).json({ success: false, message: "Error updating AI configuration" });
    }
};

export const chatWithAi = async (req: Request, res: Response) => {
    try {
        const { message, subjectId, topicId, sessionId: reqSessionId } = req.body;
        const user = (req as any).user;
        const userId = user.id || user._id;
        const userRole = user.userType;
        const userClass = user.enrollment?.classId;
        const userSection = user.enrollment?.sectionId;
        const tenantId = user.tenantId;
        const schoolId = user.schoolId;

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

        // 5. Save to History (Service handles both Redis & MongoDB)
        await AiHistoryService.saveChatTurn({
            sessionId,
            tenantId,
            schoolId,
            userId: userId.toString(),
            userRole,
            subjectId,
            topicId,
            userMessage: message,
            assistantMessage: mockResponse.answer
        });

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
