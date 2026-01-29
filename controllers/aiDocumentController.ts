import { Request, Response } from "express";
import { AiDocumentService } from "../services/aiDocumentService";
import { AwsService } from "../services/awsService";
import { AiDocumentModel } from "../models/AiDocument.model";
import { logError } from "../utils/errorLogger";

/**
 * Ingest a document: Upload to S3, Save to Mongo, and trigger RAG Microservice
 * POST /api/ai-docs/ingest
 */
export const ingestDocument = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: "File is required" });
        }

        const {
            tenantId,
            schoolId,
            classId,
            sectionId,
            title,
            subject,
        } = req.body;

        if (!tenantId || !schoolId) {
            return res.status(400).json({ message: "tenantId and schoolId are required" });
        }

        const userId = (req as any).user?._id || req.body.userId;
        const s3Key = `knowledge-base/${tenantId}/${schoolId}/${Date.now()}_${file.originalname}`;

        // 1. Upload to S3
        await AwsService.uploadBuffer({
            key: s3Key,
            buffer: file.buffer,
            contentType: file.mimetype,
        });

        // 2. Save to MongoDB
        const document = await AiDocumentService.registerDocument({
            tenantId,
            schoolId,
            classId,
            sectionId,
            fileName: title || file.originalname,
            originalName: file.originalname,
            s3Key,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedBy: userId,
            metadata: { category: "knowledge-base", subject },
        });

        // 3. Call RAG Microservice
        const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`;
        const webhookUrl = `${baseUrl}/api/webhooks/ai-ingestion`;
        console.log("[AiDocumentController] Generated Webhook URL:", webhookUrl);

        let ragResponse;
        try {
            ragResponse = await AiDocumentService.callToRagMicroservice({
                tenantId,
                schoolId,
                fileBuffer: file.buffer,
                fileName: file.originalname,
                webhookUrl,
            });

            // Update document with RAG ID
            if (ragResponse && ragResponse.document_id) {
                await AiDocumentService.updateStatus(
                    (document._id as any).toString(),
                    "processing",
                    undefined
                );
                // We might want to store ragDocumentId too
                (document as any).ragDocumentId = ragResponse.document_id;
                await document.save();
            }
        } catch (ragError) {
            console.error("RAG Microservice Trigger Failed:", ragError);
            await logError(req, ragError, "RAG Microservice Trigger Failed during ingestion");
            // We still have the doc in Mongo/S3, but status remains 'processing' or could be set to 'failed' depending on policy
        }

        return res.status(202).json({
            message: "Ingestion started successfully",
            data: {
                documentId: document._id,
                ragStatus: ragResponse?.status || "failed_to_trigger",
                ragDocumentId: ragResponse?.document_id,
            },
        });
    } catch (error) {
        console.error("Ingest Document Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

/**
 * Register a new document after upload to S3
 * POST /api/ai-docs/register
 */
export const registerDocument = async (req: Request, res: Response) => {
    try {
        const {
            tenantId,
            schoolId,
            classId,
            sectionId,
            fileName,
            originalName,
            s3Key,
            fileType,
            fileSize,
            metadata,
        } = req.body;

        const userId = (req as any).user?._id || req.body.userId; // Assuming auth middleware attaches user

        if (!tenantId || !schoolId || !fileName || !s3Key) {
            return res.status(400).json({
                message: "Missing required fields: tenantId, schoolId, fileName, s3Key",
            });
        }

        const document = await AiDocumentService.registerDocument({
            tenantId,
            schoolId,
            classId,
            sectionId,
            fileName,
            originalName,
            s3Key,
            fileType,
            fileSize,
            uploadedBy: userId,
            metadata,
        });

        return res.status(201).json({
            message: "Document registered successfully",
            data: document,
        });
    } catch (error) {
        console.error("Register Document Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

/**
 * List documents with hierarchy filters
 * GET /api/ai-docs
 */
export const getDocuments = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId, classId, sectionId } = req.query as any;

        if (!tenantId) {
            return res.status(400).json({ message: "tenantId is required" });
        }

        const documents = await AiDocumentService.getDocuments({
            tenantId,
            schoolId,
            classId,
            sectionId,
        });

        return res.status(200).json({
            message: "Documents fetched successfully",
            data: documents,
        });
    } catch (error) {
        console.error("Get Documents Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

/**
 * Soft delete a document
 * DELETE /api/ai-docs/:id
 */
export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const document = await AiDocumentService.deleteDocument(id);
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        return res.status(200).json({
            message: "Document deleted successfully",
            data: document,
        });
    } catch (error) {
        console.error("Delete Document Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

/**
 * Sync status for all documents in 'processing' state for a tenant
 * POST /api/ai-docs/sync
 */
export const syncDocuments = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId } = req.body;

        if (!tenantId) {
            return res.status(400).json({ message: "tenantId is required" });
        }

        // 1. Find all docs in processing
        const processingDocs = await AiDocumentModel.find({
            tenantId,
            ...(schoolId && { schoolId }),
            status: "processing",
            isDeleted: false,
            ragDocumentId: { $exists: true, $ne: null }
        });

        const results = {
            updated: 0,
            stillProcessing: 0,
            failed: 0
        };

        // 2. Poll RAG Service for each
        for (const doc of processingDocs) {
            try {
                const ragStatusData = await AiDocumentService.getRagStatus(
                    doc.ragDocumentId!,
                    doc.tenantId,
                    doc.schoolId.toString()
                );

                if (ragStatusData.status === "completed") {
                    await AiDocumentService.updateStatus(
                        (doc._id as any).toString(),
                        "indexed",
                        ragStatusData.vector_ids || []
                    );
                    results.updated++;
                } else if (ragStatusData.status === "failed") {
                    await AiDocumentService.updateStatus((doc._id as any).toString(), "failed");
                    results.failed++;
                } else {
                    results.stillProcessing++;
                }
            } catch (err) {
                console.error(`Failed to sync doc ${doc._id}:`, err);
                results.failed++;
            }
        }

        return res.status(200).json({
            message: "Sync completed",
            details: results
        });
    } catch (error) {
        console.error("Sync Documents Error:", error);
        await logError(req, error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
