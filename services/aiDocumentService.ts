import { AiDocumentModel, IAiDocument } from "../models/AiDocument.model";
import { Types } from "mongoose";
import axios from "axios";
import FormData from "form-data";
import { aiConfig } from "../config/ai";

export class AiDocumentService {
    /**
     * Register a new document in the system and prepare for processing.
     */
    static async registerDocument(params: {
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
        metadata?: any;
    }) {
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
            metadata: {
                ...metadata,
                uploadedBy: new Types.ObjectId(uploadedBy),
            },
        });

        await doc.save();
        return doc;
    }

    /**
     * Update document status (e.g., after Vector DB indexing is complete)
     */
    static async updateStatus(
        documentId: string,
        status: IAiDocument["status"],
        vectorIds?: string[]
    ) {
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
    }

    /**
     * Get documents based on tenant hierarchy
     */
    static async getDocuments(query: {
        tenantId: string;
        schoolId?: string;
        classId?: string;
        sectionId?: string;
    }) {
        const filter: any = { tenantId: query.tenantId, isDeleted: false };
        if (query.schoolId) filter.schoolId = new Types.ObjectId(query.schoolId);
        if (query.classId) filter.classId = new Types.ObjectId(query.classId);
        if (query.sectionId) filter.sectionId = new Types.ObjectId(query.sectionId);

        return await AiDocumentModel.find(filter).sort({ createdAt: -1 });
    }

    /**
     * Soft delete a document and prepare for cleanup in S3/VectorDB
     */
    static async deleteDocument(documentId: string) {
        return await AiDocumentModel.findByIdAndUpdate(
            documentId,
            { $set: { isDeleted: true } },
            { new: true }
        );
    }

    /**
     * Calls the RAG microservice to start document ingestion.
     */
    static async callToRagMicroservice(params: {
        tenantId: string;
        schoolId: string;
        fileBuffer: Buffer;
        fileName: string;
        webhookUrl: string;
    }) {
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
                    "x-token": aiConfig.xToken || "secret-token-change-me",
                },
            });
            return response.data;
        } catch (error: any) {
            console.error("[AiDocumentService] Microservice Error:", error.response?.data || error.message);
            throw error;
        }
    }
}
