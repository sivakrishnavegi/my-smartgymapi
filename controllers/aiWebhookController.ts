import { Request, Response } from "express";
import { AiDocumentModel } from "../models/AiDocument.model";
import { logError } from "../utils/errorLogger";

/**
 * Handle status updates from the RAG Microservice
 * POST /api/webhooks/ai-ingestion
 */
export const aiIngestionWebhook = async (req: Request, res: Response) => {
    try {
        const { document_id, status, vector_ids, error } = req.body;

        console.log(`[AI Webhook] Received update for doc ${document_id}: status=${status}`);

        if (!document_id || !status) {
            return res.status(400).json({ message: "document_id and status are required" });
        }

        // Find document by ragDocumentId
        const document = await AiDocumentModel.findOne({ ragDocumentId: document_id });

        if (!document) {
            console.warn(`[AI Webhook] Document with RAG ID ${document_id} not found.`);
            return res.status(404).json({ message: "Document not found" });
        }

        // Update status and vector IDs
        document.status = status === "completed" ? "indexed" : status === "failed" ? "failed" : "processing";
        if (vector_ids) {
            document.vectorIds = vector_ids;
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

        return res.status(200).json({ message: "Webhook received and processed" });
    } catch (error) {
        console.error("AI Webhook Error:", error);
        await logError(req, error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
