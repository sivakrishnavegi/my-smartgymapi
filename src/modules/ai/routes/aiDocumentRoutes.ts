import { Router } from "express";
import { registerDocument, getDocuments, deleteDocument, ingestDocument, syncDocuments, getDocumentUrl } from "@ai/controllers/aiDocumentController";
import { aiIngestionWebhook } from "@ai/controllers/aiWebhookController";
import { protect } from "@shared/middlewares/authMiddleware";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public Webhook (or secure with secret)
router.post("/webhooks/ai-ingestion", aiIngestionWebhook);

// Protect all other document routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: AI Document Management
 *   description: Management of knowledge base documents for AI RAG
 */

/**
 * @swagger
 * /api/ai-docs/ingest:
 *   post:
 *     summary: Ingest a document (S3 + Mongo + RAG Microservice)
 *     tags: [AI Document Management]
 *     security:
 *       - bearerAuth: []
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - tenantId
 *               - schoolId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document to ingest (PDF)
 *               tenantId:
 *                 type: string
 *               schoolId:
 *                 type: string
 *               classId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *               title:
 *                 type: string
 *                 description: Optional title for the document
 *               subject:
 *                 type: string
 *                 description: Subject category for the document
 *     responses:
 *       202:
 *         description: Ingestion started successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal Server Error
 */
router.post("/ingest", upload.single("file"), ingestDocument);

/**
 * @swagger
 * /api/ai-docs/register:
 *   post:
 *     summary: Register a new document in the system
 *     tags: [AI Document Management]
 *     security:
 *       - bearerAuth: []
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - schoolId
 *               - fileName
 *               - s3Key
 *             properties:
 *               tenantId:
 *                 type: string
 *               schoolId:
 *                 type: string
 *               fileName:
 *                 type: string
 *               s3Key:
 *                 type: string
 *               fileType:
 *                 type: string
 *               fileSize:
 *                 type: number
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Document registered successfully
 */
router.post("/register", registerDocument);

/**
 * @swagger
 * /api/ai-docs:
 *   get:
 *     summary: List documents based on tenant hierarchy
 *     tags: [AI Document Management]
 *     security:
 *       - bearerAuth: []
 *       - xTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documents fetched successfully
 */
router.get("/", getDocuments);

/**
 * @swagger
 * /api/ai-docs/{id}:
 *   delete:
 *     summary: Soft delete a document
 *     tags: [AI Document Management]
 *     security:
 *       - bearerAuth: []
 *       - xTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 */
router.delete("/:id", deleteDocument);

/**
 * @swagger
 * /api/ai-docs/{id}/url:
 *   get:
 *     summary: Get a pre-signed S3 download/view URL for a document
 *     tags: [AI Document Management]
 *     security:
 *       - bearerAuth: []
 *       - xTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileName: { type: string }
 *                     downloadUrl: { type: string }
 *       404:
 *         description: Document not found
 */
router.get("/:id/url", getDocumentUrl);

/**
 * @swagger
 * /api/ai-docs/sync:
 *   post:
 *     summary: Sync status for all 'processing' documents
 *     tags: [AI Document Management]
 *     security:
 *       - bearerAuth: []
 *       - xTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *             properties:
 *               tenantId:
 *                 type: string
 *               schoolId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sync completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 details:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: number
 *                     stillProcessing:
 *                       type: number
 *                     failed:
 *                       type: number
 */
router.post("/sync", syncDocuments);

/**
 * @swagger
 * /api/ai-docs/webhooks/ai-ingestion:
 *   post:
 *     summary: Webhook for RAG microservice status updates
 *     tags: [AI Document Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - document_id
 *               - status
 *             properties:
 *               document_id:
 *                 type: string
 *                 description: The RAG document ID
 *               status:
 *                 type: string
 *                 enum: [completed, failed, processing]
 *               vector_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               error:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook received and processed
 */

export default router;
