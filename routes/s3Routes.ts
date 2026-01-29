import { Router } from "express";
import { getPresignedUrl, listFiles, verifyUpload } from "../controllers/s3Controller";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

// Protect all S3 routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: S3 File Management
 *   description: Utilities for secure S3 file storage and retrieval
 */

/**
 * @swagger
 * /api/s3/presigned-url:
 *   get:
 *     summary: Get a pre-signed URL for uploading a file to S3
 *     tags: [S3 File Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pre-signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                 key:
 *                   type: string
 */
router.get("/presigned-url", getPresignedUrl);

/**
 * @swagger
 * /api/s3/list:
 *   get:
 *     summary: List files in S3 bucket
 *     tags: [S3 File Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bucket listed successfully
 */
router.get("/list", listFiles);

/**
 * @swagger
 * /api/s3/verify:
 *   post:
 *     summary: Verify if a file exists in S3 after upload
 *     tags: [S3 File Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - s3Key
 *             properties:
 *               s3Key:
 *                 type: string
 *     responses:
 *       200:
 *         description: File exists
 *       404:
 *         description: File not found
 */
router.post("/verify", verifyUpload);

export default router;
