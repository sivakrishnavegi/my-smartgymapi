import { Request, Response } from "express";
import { AwsService } from "../services/awsService";
import { logError } from "../utils/errorLogger";

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
