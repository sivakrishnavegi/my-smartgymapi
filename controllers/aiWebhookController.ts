import { Request, Response } from "express";
import { AiDocumentModel } from "../models/AiDocument.model";
import { logError } from "../utils/errorLogger";
import { cacheService } from "../services/cacheService";

/**
 * Handle status updates from the RAG Microservice
 * POST /api/webhooks/ai-ingestion
 */
export const aiIngestionWebhook = async (req: Request, res: Response) => {
    try {
        console.log("[AI Webhook] Full Payload:", JSON.stringify(req.body, null, 2));

        // Parse Payload (Handle nested document structure if present)
        let { document_id, id, status, vector_ids, vectorIds, chunks, segments, data, error } = req.body;
        let content = "";

        // Normalize ID
        const finalId = document_id || id || (req.body.document ? req.body.document.id : null);

        // Fallback for nested structure (microservice v2)
        if (req.body.document) {
            const doc = req.body.document;
            if (!content) content = doc.content || "";
            if (!status) status = doc.status;
            if (!vector_ids) {
                vector_ids = doc.vector_ids || doc.vectorIds || doc.chunks || doc.segments;
            }
        }

        // Check for data nesting
        if (!vector_ids && data) {
            vector_ids = data.vector_ids || data.vectorIds || data.chunks || data.segments;
        }

        // Use any discovered field
        const finalVectorIds = vector_ids || vectorIds || chunks || segments;

        console.log(`[AI Webhook] Received update for doc ${finalId}: status=${status}`);

        if (!finalId || !status) {
            return res.status(400).json({ message: "document_id/id and status are required" });
        }

        // Find document by ragDocumentId
        const document = await AiDocumentModel.findOne({ ragDocumentId: finalId });

        if (!document) {
            console.warn(`[AI Webhook] Document with RAG ID ${finalId} not found.`);
            return res.status(404).json({ message: "Document not found" });
        }

        // Update status, content and vector IDs
        document.status = status === "completed" ? "indexed" : status === "failed" ? "failed" : "processing";

        if (content) {
            document.content = content;
        }

        if (finalVectorIds) {
            document.vectorIds = finalVectorIds;
        }

        // Store error metadata if present
        if (error) {
            document.metadata = {
                ...document.metadata,
                // @ts-ignore
                ingestionError: error
            };
        }

        await document.save();

        // Invalidate Cache for this school's dashboard
        const pattern = cacheService.generateKey("ct", document.tenantId, document.schoolId.toString(), "*");
        await cacheService.clearPattern(pattern);

        return res.status(200).json({ message: "Webhook received and processed" });
    } catch (error) {
        console.error("AI Webhook Error:", error);
        await logError(req, error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
