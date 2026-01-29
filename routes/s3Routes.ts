import { Router } from "express";
import { getPresignedUrl, listFiles, verifyUpload } from "../controllers/s3Controller";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

// Protect all S3 routes
router.use(protect);

/**
 * @swagger
 * /api/s3/presigned-url:
 *   get:
 *     summary: Get a pre-signed URL for uploading a file to S3
 *     tags: [S3 File Management]
 */
router.get("/presigned-url", getPresignedUrl);

/**
 * @swagger
 * /api/s3/list:
 *   get:
 *     summary: List files in S3 bucket
 *     tags: [S3 File Management]
 */
router.get("/list", listFiles);

/**
 * @swagger
 * /api/s3/verify:
 *   post:
 *     summary: Verify if a file exists in S3 after upload
 *     tags: [S3 File Management]
 */
router.post("/verify", verifyUpload);

export default router;
