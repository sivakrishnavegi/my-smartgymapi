import { z } from "zod";
import { Types } from "mongoose";

/**
 * Helper for validating MongoDB ObjectIds
 */
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid MongoDB ObjectId"
});

/**
 * Schema for /api/ai-teacher/ask
 */
export const askAiSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    input: z.object({
        type: z.enum(["text", "image", "audio"]).default("text"),
        content: z.string().min(1, "Input content is required")
    }),
    context: z.object({
        chapter: z.string().optional(),
        language: z.string().default("en")
    }).default({ language: "en" }),
    options: z.object({
        difficulty: z.enum(["simple", "medium", "advanced"]).default("simple"),
        use_examples: z.boolean().default(true)
    }).default({ difficulty: "simple", use_examples: true }),
    client_meta: z.record(z.string(), z.any()).default({}),
    tenantId: z.string().optional(),
    schoolId: objectIdSchema.optional(),
    sessionId: z.string().optional()
});

/**
 * Schema for /api/ai-teacher/chat
 */
export const chatAiSchema = z.object({
    message: z.string().min(1, "Message is required"),
    subjectId: z.string().optional(),
    topicId: z.string().optional(),
    sessionId: z.string().optional()
});

/**
 * Schema for /api/ai-teacher/config (Update/Create)
 */
export const updateAiConfigSchema = z.object({
    isEnabled: z.boolean().optional(),
    subscription: z.object({
        tier: z.enum(["free", "basic", "premium"]),
        expiresAt: z.string().datetime().optional()
    }).optional(),
    tokenManagement: z.object({
        monthlyLimit: z.number().positive().optional()
    }).optional(),
    config: z.object({
        modelVendor: z.string().optional(),
        defaultModel: z.string().optional(),
        temperature: z.number().min(0).max(1).optional()
    }).optional(),
    tenantId: z.string().optional(),
    schoolId: objectIdSchema.optional()
});

/**
 * Schema for /api/ai-teacher/config (GET query)
 */
export const getAiConfigQuerySchema = z.object({
    tenantId: z.string().optional(),
    schoolId: objectIdSchema.optional()
});
