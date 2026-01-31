import { Request, Response } from "express";
import { Types } from "mongoose";
import { AiDocumentService } from "@ai/services/aiDocumentService";
import { AwsService } from "@shared/services/awsService";
import { AiDocumentModel } from "@ai/models/AiDocument.model";
import { logError } from "@shared/utils/errorLogger";
import { getPagination, buildPaginationResponse } from "@shared/utils/pagination";
import { cacheService } from "@shared/services/cacheService";

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
            subjectId,
            title,
            subject,
        } = req.body;

        if (!tenantId || !schoolId) {
            return res.status(400).json({ message: "tenantId and schoolId are required" });
        }

        const userId = (req as any).user?._id || req.body.userId;
        const s3Key = `knowledge-base/${tenantId}/${schoolId}/${Date.now()}_${file.originalname}`;

        // 0. Calculate Content Hash for deduplication
        const crypto = require("crypto");
        const contentHash = crypto.createHash("sha256").update(file.buffer).digest("hex");

        // 1. Check if an identical document already exists and is indexed
        const existingDoc = await AiDocumentService.findExistingDuplicate(tenantId, contentHash);

        if (existingDoc) {
            console.log(`[AiDocumentController] Duplicate content detected. Updating existing record: ${existingDoc._id}`);

            // Update the existing record with latest hierarchy and metadata
            const updated = await AiDocumentModel.findByIdAndUpdate(
                existingDoc._id,
                {
                    $set: {
                        classId: classId ? new Types.ObjectId(classId) : (existingDoc as any).classId,
                        sectionId: sectionId ? new Types.ObjectId(sectionId) : (existingDoc as any).sectionId,
                        subjectId: subjectId ? new Types.ObjectId(subjectId) : (existingDoc as any).subjectId,
                        schoolId: new Types.ObjectId(schoolId),
                        fileName: title || file.originalname,
                        metadata: {
                            ...existingDoc.metadata,
                            subject: subject || existingDoc.metadata.category,
                            updatedBy: userId,
                            lastUpdated: new Date()
                        }
                    }
                },
                { new: true }
            );

            return res.status(200).json({
                message: "Duplicate document detected. Metadata updated to latest.",
                data: {
                    documentId: updated?._id,
                    ragStatus: "indexed",
                    ragDocumentId: existingDoc.ragDocumentId,
                    isDuplicate: true,
                    updated: true
                },
            });
        }

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
            subjectId,
            fileName: title || file.originalname,
            originalName: file.originalname,
            s3Key,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedBy: userId,
            contentHash, // Store the hash
            metadata: { category: "knowledge-base", subject },
        });

        // 3. Call RAG Microservice
        console.log("[DEBUG] process.env.API_BASE_URL:", process.env.API_BASE_URL);
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
                isDuplicate: false
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

        const { page, limit, skip } = getPagination(req);

        const { documents, total } = await AiDocumentService.getDocuments({
            tenantId,
            schoolId,
            classId,
            sectionId,
            skip,
            limit
        });

        return res.status(200).json({
            message: "Documents fetched successfully",
            data: documents,
            pagination: buildPaginationResponse(page, limit, total),
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

        if (!id) {
            return res.status(400).json({ error: "Missing document ID in request parameters" });
        }

        const document = await AiDocumentService.deleteDocument(id);
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        // Invalidate Cache for this school's dashboard
        const pattern = cacheService.generateKey("ct", document.tenantId, document.schoolId.toString(), "*");
        await cacheService.clearPattern(pattern);

        return res.status(200).json({
            message: "Document deleted successfully",
            data: document,
        });
    } catch (error: any) {
        if (error.message === "ALREADY_DELETED") {
            return res.status(400).json({ message: "Document is already deleted" });
        }
        console.error("Delete Document Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

/**
 * Get a pre-signed download URL for a file
 * GET /api/ai-docs/:id/url
 */
export const getDocumentUrl = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Fetch document metadata
        const document = await AiDocumentService.getDocumentById(id);
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        // 2. Generate pre-signed URL from S3
        const downloadUrl = await AwsService.getDownloadUrl(document.s3Key);

        return res.status(200).json({
            message: "Download URL generated successfully",
            data: {
                fileName: document.fileName,
                downloadUrl,
            },
        });
    } catch (error) {
        console.error("Get Document URL Error:", error);
        await logError(req, error);
        return res.status(500).json({ message: "Internal Server Error" });
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
