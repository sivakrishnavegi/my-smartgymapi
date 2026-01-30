import { AiDocumentModel, IAiDocument } from "../models/AiDocument.model";
import { Types } from "mongoose";
import axios from "axios";
import FormData from "form-data";
import { aiConfig } from "../config/ai";

/**
 * Register a new document in the system and prepare for processing.
 */
const registerDocument = async (params: {
    tenantId: string;
    schoolId: string;
    classId?: string;
    sectionId?: string;
    fileName: string;
    originalName: string;
    s3Key: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    contentHash?: string;
    metadata?: any;
}) => {
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
        uploadedBy,
        contentHash,
        metadata,
    } = params;

    const doc = new AiDocumentModel({
        tenantId,
        schoolId: new Types.ObjectId(schoolId),
        classId: classId ? new Types.ObjectId(classId) : undefined,
        sectionId: sectionId ? new Types.ObjectId(sectionId) : undefined,
        fileName,
        originalName,
        s3Key,
        fileType,
        fileSize,
        status: "processing",
        contentHash,
        metadata: {
            ...metadata,
            uploadedBy: new Types.ObjectId(uploadedBy),
        },
    });

    await doc.save();
    return doc;
};

/**
 * Update document status (e.g., after Vector DB indexing is complete)
 */
const updateStatus = async (
    documentId: string,
    status: IAiDocument["status"],
    vectorIds?: string[]
) => {
    return await AiDocumentModel.findByIdAndUpdate(
        documentId,
        {
            $set: {
                status,
                ...(vectorIds && { vectorIds }),
            },
        },
        { new: true }
    );
};

/**
 * Get documents based on tenant hierarchy
 */
const getDocuments = async (query: {
    tenantId: string;
    schoolId?: string;
    classId?: string;
    sectionId?: string;
    skip?: number;
    limit?: number;
}) => {
    const filter: any = { tenantId: query.tenantId, isDeleted: false };
    if (query.schoolId) filter.schoolId = new Types.ObjectId(query.schoolId);
    if (query.classId) filter.classId = new Types.ObjectId(query.classId);
    if (query.sectionId) filter.sectionId = new Types.ObjectId(query.sectionId);

    const skip = query.skip || 0;
    const limit = query.limit || 10;

    const [documents, total] = await Promise.all([
        AiDocumentModel.find(filter)
            .populate("classId", "name")
            .populate("sectionId", "sectionName")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AiDocumentModel.countDocuments(filter)
    ]);

    return { documents, total };
};

/**
 * Get a specific document by its ID
 */
const getDocumentById = async (id: string) => {
    return await AiDocumentModel.findOne({ _id: id, isDeleted: false }).lean();
};

/**
 * Find an existing, successfully indexed document with the same content hash
 */
const findExistingDuplicate = async (tenantId: string, contentHash: string) => {
    return await AiDocumentModel.findOne({
        tenantId,
        contentHash,
        status: "indexed",
        isDeleted: false,
        ragDocumentId: { $exists: true, $ne: null }
    }).lean();
};

/**
 * Delete from RAG Microservice
 */
const deleteFromRag = async (tenantId: string, schoolId: string, ragDocumentId: string) => {
    const url = `${aiConfig.ragServiceBaseUrl}/api/v1/rag/documents/${tenantId}/${schoolId}/${ragDocumentId}`;
    try {
        await axios.delete(url, {
            headers: {
                "accept": "application/json",
                "X-TOKEN": aiConfig.xToken || "secret-token-change-me",
                "x-key": aiConfig.serviceKey || "default-secret-key",
            },
        });
        console.log(`[AiDocumentService] Successfully deleted from RAG: ${ragDocumentId}`);
    } catch (error: any) {
        console.error(`[AiDocumentService] Failed to delete from RAG ${ragDocumentId}:`, error.response?.data || error.message);
        // We do not throw here to allow soft-delete to proceed (safe delete)
    }
};

/**
 * Soft delete a document and cleanup in RAG Microservice
 */
const deleteDocument = async (documentId: string) => {
    // 1. Fetch document to get RAG details
    const doc = await AiDocumentModel.findById(documentId);
    if (!doc) {
        return null;
    }

    if (doc.isDeleted) {
        throw new Error("ALREADY_DELETED");
    }

    // 2. Call RAG Microservice to delete if ragDocumentId exists
    if (doc.ragDocumentId) {
        await deleteFromRag(
            doc.tenantId,
            doc.schoolId.toString(),
            doc.ragDocumentId
        );
    }

    // 3. Soft delete in MongoDB
    return await AiDocumentModel.findByIdAndUpdate(
        documentId,
        { $set: { isDeleted: true } },
        { new: true }
    );
};

/**
 * Calls the RAG microservice to start document ingestion.
 */
const callToRagMicroservice = async (params: {
    tenantId: string;
    schoolId: string;
    fileBuffer: Buffer;
    fileName: string;
    webhookUrl: string;
}) => {
    const { tenantId, schoolId, fileBuffer, fileName, webhookUrl } = params;

    // Create Form Data
    const form = new FormData();
    form.append("file", fileBuffer, { filename: fileName, contentType: "application/pdf" });
    form.append("webhook_url", webhookUrl);

    const url = `${aiConfig.ragServiceBaseUrl}/api/v1/rag/documents/${tenantId}/${schoolId}`;

    try {
        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders(),
                "accept": "application/json",
                "X-TOKEN": aiConfig.xToken || "secret-token-change-me",
                "x-key": aiConfig.serviceKey || "default-secret-key",
            },
        });
        return response.data;
    } catch (error: any) {
        console.error("[AiDocumentService] Microservice Error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetch document status from RAG microservice.
 */
const getRagStatus = async (ragDocumentId: string, tenantId: string, schoolId: string) => {
    const url = `${aiConfig.ragServiceBaseUrl}/api/v1/rag/documents/${tenantId}/${schoolId}/status/${ragDocumentId}`;
    try {
        const response = await axios.get(url, {
            headers: {
                "accept": "application/json",
                "X-TOKEN": aiConfig.xToken || "secret-token-change-me",
                "x-key": aiConfig.serviceKey || "default-secret-key",
            },
        });
        return response.data; // { status: "completed" | "failed" | "processing", vector_ids: [...] }
    } catch (error: any) {
        console.error(`[AiDocumentService] Status Check Error for ${ragDocumentId}:`, error.response?.data || error.message);
        throw error;
    }
};

export const AiDocumentService = {
    registerDocument,
    updateStatus,
    getDocuments,
    deleteDocument,
    callToRagMicroservice,
    getRagStatus,
    findExistingDuplicate,
    getDocumentById,
};
