import { Request, Response } from "express";
import redis from "@shared/config/redis";
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
import { AiConfigModel } from "@ai/models/AiConfig";
import { AiHistoryService } from "@ai/services/aiHistoryService";
import { askAiQuestion, checkAiHealth } from "@ai/services/aiService";
import { logError } from "@shared/utils/errorLogger";
import { AiGovernanceConfigModel } from "@ai/models/AiGovernanceConfig.model";

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

        // Security Resolve: Use payload if provided, but ensure it matches user's tenant for security
        // Admin might be allowed to cross-tenant in some systems, but here we enforce consistency or role check
        const tenantId = payloadTenantId || user.tenantId;
        const schoolId = payloadSchoolId || user.schoolId;

        if (user.role !== 'admin' && tenantId.toString() !== user.tenantId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You cannot request AI services for a different tenant."
            });
        }

        // 1. Check AI Configuration & Subscription
        const aiConfig = await AiConfigModel.findOne({ tenantId, schoolId });
        if (!aiConfig) {
            return res.status(404).json({
                success: false,
                message: "AI Configuration not found for this school. Please setup AI config first."
            });
        }

        if (!aiConfig.isEnabled) {
            return res.status(403).json({
                success: false,
                message: "AI Teacher service is currently disabled for this school."
            });
        }

        // 2. Check Token Limits
        const used = aiConfig.tokenManagement?.usedThisMonth || 0;
        const limit = aiConfig.tokenManagement?.monthlyLimit || 0;
        if (used >= limit) {
            return res.status(403).json({
                success: false,
                message: "Monthly AI token limit reached. Please upgrade your plan or contact support."
            });
        }

        // 3. Fetch Governance Configuration
        let governanceConfig = await AiGovernanceConfigModel.findOne({ tenantId, schoolId });
        if (!governanceConfig) {
            governanceConfig = new AiGovernanceConfigModel({ tenantId, schoolId }); // Use defaults
        }

        // Determine Teaching Style
        const requestedStyleId = options?.teachingStyle || "socratic";
        const activeStyle = governanceConfig.teachingStyles.find(s => s.id === requestedStyleId)
            || governanceConfig.teachingStyles.find(s => s.isDefault)
            || governanceConfig.teachingStyles[0];

        // 4. Prepare Payload for FastAPI
        const sessionId = reqSessionId || uuidv4();
        const pythonPayload = {
            query: input.content,
            tenant_id: tenantId,
            school_id: schoolId,
            context_filters: {
                subject,
                userRole: user.role,
                ...context
            },
            governance: {
                system_prompt: governanceConfig.globalSystemPrompt,
                teaching_style: activeStyle ? activeStyle.prompt : "",
                safety_guardrails: governanceConfig.safetyGuardrails
            },
            options
        };

        // 4. Call AI Service (Internal Health Check & Redis Caching & Logging)
        let aiResponse;
        try {
            aiResponse = await askAiQuestion({
                payload: pythonPayload,
                tenantId: tenantId.toString(),
                userId: userId.toString(),
                route: req.originalUrl
            });

            if (!aiResponse || !aiResponse.answer) {
                throw new Error("EMPTY_AI_RESPONSE");
            }
        } catch (err: any) {
            await logError(req, err, `AI Service Call Failed for user ${userId}`);

            if (err.message === 'AI_SERVICE_UNAVAILABLE') {
                return res.status(503).json({
                    success: false,
                    message: "AI microservice is currently unreachable. Please try again shortly."
                });
            }

            return res.status(500).json({
                success: false,
                message: "AI provider failed to respond. Technical details logged."
            });
        }

        // 5. Update Usage (Atomic) and History (via Service)
        const tokensUsed = aiResponse.usage?.totalTokens || 0;
        const [updatedConfig] = await Promise.all([
            AiConfigModel.findOneAndUpdate(
                { tenantId, schoolId },
                {
                    $inc: {
                        "tokenManagement.usedThisMonth": tokensUsed,
                        "tokenManagement.totalUsed": tokensUsed
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
                usage: aiResponse.usage,
                meta: client_meta
            })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                answer: aiResponse.answer,
                sessionId,
                usage: aiResponse.usage,
                remainingTokens: updatedConfig ? updatedConfig.tokenManagement.monthlyLimit - updatedConfig.tokenManagement.usedThisMonth : 0
            }
        });

    } catch (error: any) {
        console.error("AI Ask Critical Error:", error);
        res.status(500).json({
            success: false,
            message: "A critical error occurred while processing your AI request."
        });
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

        // Security: Prevent updating subscription or token limits via this endpoint
        // These should only be updated by internal system processes or super-admin specific routes

        const updateData: any = {
            updatedAt: new Date()
        };

        // Allow toggling system availability
        if (typeof isEnabled === 'boolean') {
            updateData.isEnabled = isEnabled;
        }

        // Allow updating model config
        if (config) {
            // Validate temperature
            if (typeof config.temperature === 'number') {
                if (config.temperature < 0 || config.temperature > 1) {
                    return res.status(400).json({ success: false, message: "Temperature must be between 0 and 1" });
                }
            }
            updateData.config = config;
        }

        const updatedConfig = await AiConfigModel.findOneAndUpdate(
            { tenantId, schoolId },
            {
                $set: updateData
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

        // userType is mapped from auth middleware
        const userRole = user.role || user.userType;
        const tenantId = user.tenantId;
        const schoolId = user.schoolId;

        // 1. Rate Limiting (Enhanced Fail-safe)
        try {
            const isAllowed = await checkRateLimit(userId.toString(), 20, 60);
            if (!isAllowed) {
                return res.status(429).json({
                    success: false,
                    message: "Too many chat requests. Please slow down and try again in a minute."
                });
            }
        } catch (redisErr) {
            console.error("[AiController] Rate limit check failed (Redis down?):", redisErr);
            // Fail-safe: Allow if Redis is down, but log it.
        }

        // 2. Generate or Use Session ID
        const sessionId = reqSessionId || uuidv4();

        // 3. Mock Forwarding to Python Microservice (In real scenario, call askAiQuestion or similar)
        // For now keeping the mock logic but making it cleaner
        console.log(`[AI Proxy] Chat Session=${sessionId}, User=${userId}, Msg="${message}"`);

        // 4. Response (Mocking RAG response)
        const mockResponse = {
            answer: `[AI Teacher] I've received your message: "${message}". Currently, I'm analyzing this based on your profile as a ${userRole}.`,
            sources: ["General Academic Knowledge Base"],
            sessionId
        };

        // 5. Save to History (Service handles both Redis & MongoDB)
        try {
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
        } catch (historyErr) {
            console.error("[AiController] Failed to save chat history:", historyErr);
            // Fail-safe: Continue even if history save fails (non-blocking for user)
        }

        res.status(200).json({
            success: true,
            data: mockResponse
        });

    } catch (error: any) {
        console.error("AI Chat Error:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your chat request."
        });
    }
};

// --- Knowledge Ingestion ---
import { ingestionQueue } from "@shared/config/queue";

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
