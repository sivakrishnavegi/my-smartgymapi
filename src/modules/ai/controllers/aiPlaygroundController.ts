import { Request, Response } from "express";
import { AiService } from "@ai/services/aiService";
import { AiChatHistoryModel } from "@ai/models/AiChatHistory.model";
import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { logError } from "@shared/utils/errorLogger";

/**
 * Handle AI Playground Chat
 * POST /api/ai/playground/chat
 */
export const handleChat = async (req: Request, res: Response) => {
    const requestId = (req.headers["x-request-id"] as string) || uuidv4();

    try {
        const {
            question,
            classId,
            sectionId,
            subjectId,
            sessionId, // Optional, implies continuing a conversation
        } = req.body;

        console.log(`[AiPlayground] Request started. ID: ${requestId}, User: ${(req as any).user?.id}`);

        const user = (req as any).user;

        if (!question) {
            return res.status(400).json({ message: "Question is required" });
        }

        if (!user || !user.id) {
            return res.status(401).json({ message: "User context missing or invalid" });
        }

        // 1. Resolve or Generate Session ID
        const resolvedSessionId = sessionId || uuidv4();

        // 2. Prepare Context
        const context = {
            classId: classId ? new Types.ObjectId(classId) : undefined,
            sectionId: sectionId ? new Types.ObjectId(sectionId) : undefined,
            subjectId: subjectId, // Keeping as string per schema, or ObjectId if valid
        };

        // 3. Find or Create Chat History Record
        let chatHistory = await AiChatHistoryModel.findOne({ sessionId: resolvedSessionId });

        if (!chatHistory) {
            chatHistory = new AiChatHistoryModel({
                tenantId: user.tenantId,
                schoolId: new Types.ObjectId(user.schoolId),
                userId: new Types.ObjectId(user.id),
                userEmail: user.email,
                userRole: user.role,
                sessionId: resolvedSessionId,
                title: question.substring(0, 50),
                messages: [],
                classId: context.classId,
                sectionId: context.sectionId,
                subjectId: context.subjectId,
            });
        }

        // 4. Append User Message
        chatHistory.messages.push({
            role: "user",
            content: question,
            timestamp: new Date(),
        });
        await chatHistory.save();

        // 5. Call AI Microservice
        // Prepare payload for RAG
        const aiPayload = {
            query: question,
            user_id: user.id,
            tenant_id: user.tenantId,
            school_id: user.schoolId,
            class_id: classId,
            section_id: sectionId,
            subject_id: subjectId,
            session_id: resolvedSessionId,
            history: chatHistory.messages.map(m => ({ role: m.role, content: m.content })).slice(-10) // Send last 10 messages for context
        };

        console.log("[AiPlayground] Sending payload to AI:", JSON.stringify(aiPayload, null, 2));

        let aiResponse;
        try {
            aiResponse = await AiService.askAiQuestion({
                payload: aiPayload,
                tenantId: user.tenantId,
                userId: user.id,
                route: "playground/chat",
                requestId
            });
        } catch (error: any) {
            console.error("[AiPlayground] AI Service Failed:", error.message);
            aiResponse = { answer: "I'm sorry, I encountered an error while processing your request." };
        }

        const answer = aiResponse?.answer || aiResponse?.response || "No response derived.";

        // 6. Append Assistant Message
        chatHistory.messages.push({
            role: "assistant",
            content: answer,
            timestamp: new Date(),
            usage: aiResponse?.usage
        });
        await chatHistory.save();

        // 7. Return Response
        return res.status(200).json({
            message: "Chat processed successfully",
            data: {
                sessionId: resolvedSessionId,
                response: answer,
                historyId: chatHistory._id
            }
        });

    } catch (error) {
        console.error("Handle Chat Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
            requestId
        });
    }
};
