import { Request, Response } from "express";
import { AwsService } from "../services/awsService";
import { logError } from "../utils/errorLogger";
import Media from "../src/modules/operational/models/media.schema";
import { v4 as uuidv4 } from "uuid";
import path from "path";

/**
 * Get a pre-signed URL for uploading a file
 * GET /api/s3/presigned-url
 */
export const getPresignedUrl = async (req: Request, res: Response) => {
    try {
        const { key, contentType } = req.query as any;

        if (!key || !contentType) {
            return res.status(400).json({ message: "key and contentType are required" });
        }

        const url = await AwsService.getPresignedUrl(key, contentType);

        return res.status(200).json({
            message: "Pre-signed URL generated successfully",
            data: { url, key },
        });
    } catch (error) {
        console.error("Presigned URL Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

/**
 * List files in the bucket/prefix
 * GET /api/s3/list
 */
export const listFiles = async (req: Request, res: Response) => {
    try {
        const { prefix } = req.query as any;

        const files = await AwsService.listFiles(prefix);

        return res.status(200).json({
            message: "Files fetched successfully",
            data: files.Contents || [],
        });
    } catch (error) {
        console.error("List Files Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

/**
 * Verify if a file exists (after frontend upload)
 * POST /api/s3/verify
 */
export const verifyUpload = async (req: Request, res: Response) => {
    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({ message: "key is required" });
        }

        const exists = await AwsService.checkFileExists(key);

        if (exists) {
            return res.status(200).json({
                message: "File upload verified",
                data: { exists: true, key },
            });
        } else {
            return res.status(404).json({
                message: "File not found in S3",
                data: { exists: false },
            });
        }
    } catch (error) {
        console.error("Verify Upload Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

/**
 * Upload a file to S3 with multi-tenant isolation
 * POST /api/s3/upload
 */
export const uploadFile = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        const tenantId = req.headers["x-tenant-id"] as string;
        const schoolId = req.headers["x-school-id"] as string;
        const purpose = (req.body.purpose as string) || "general";

        // userId should come from auth middleware (protect or apiKeyProtect)
        // Order: 1. Auth User 2. Specific API Key Issuer 3. Any Tenant Key Issuer 4. Hardcoded Fallback (System Admin)
        const userId = (req as any).user?.id ||
            (req as any).apiKeyEntry?.issuedBy ||
            (req as any).tenant?.apiKeys?.find((k: any) => k.issuedBy)?.issuedBy ||
            "68abcba375247cc266808bcc"; // Fallback for legacy data

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        if (!tenantId || !schoolId) {
            return res.status(400).json({
                success: false,
                message: "x-tenant-id and x-school-id headers are required"
            });
        }

        const fileExtension = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExtension}`;
        const s3Key = `tenants/${tenantId}/schools/${schoolId}/${purpose}/${fileName}`;

        // 1. Upload to S3
        await AwsService.uploadBuffer({
            key: s3Key,
            buffer: file.buffer,
            contentType: file.mimetype
        });

        // 2. Save metadata to DB
        const media = new Media({
            fileName,
            originalName: file.originalname,
            s3Key,
            mimetype: file.mimetype,
            size: file.size,
            tenantId,
            schoolId,
            uploadedBy: userId,
            purpose
        });

        await media.save();

        return res.status(201).json({
            success: true,
            message: "File uploaded successfully",
            data: {
                id: media._id,
                fileName,
                s3Key,
                url: await AwsService.getDownloadUrl(s3Key) // Optional: provide a temporary URL
            }
        });

    } catch (error: any) {
        console.error("[UPLOAD FILE ERROR]", error);
        await logError(req, error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during file upload",
            error: error.message
        });
    }
};
