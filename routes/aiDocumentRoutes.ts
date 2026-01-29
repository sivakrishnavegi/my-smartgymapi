import { Router } from "express";
import { registerDocument, getDocuments, deleteDocument, ingestDocument } from "../controllers/aiDocumentController";
import { aiIngestionWebhook } from "../controllers/aiWebhookController";
import { protect } from "../middlewares/authMiddleware";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public Webhook (or secure with secret)
router.post("/webhooks/ai-ingestion", aiIngestionWebhook);

// Protect all other document routes
router.use(protect);

/**
 * @swagger
 * /api/ai-docs/ingest:
 *   post:
 *     summary: Ingest a document (S3 + Mongo + RAG Microservice)
 *     tags: [AI Document Management]
 */
router.post("/ingest", upload.single("file"), ingestDocument);

/**
 * @swagger
 * /api/ai-docs/register:
 *   post:
 *     summary: Register a new document in the system
 *     tags: [AI Document Management]
 */
router.post("/register", registerDocument);

/**
 * @swagger
 * /api/ai-docs:
 *   get:
 *     summary: List documents based on tenant hierarchy
 *     tags: [AI Document Management]
 */
router.get("/", getDocuments);

/**
 * @swagger
 * /api/ai-docs/{id}:
 *   delete:
 *     summary: Soft delete a document
 *     tags: [AI Document Management]
 */
router.delete("/:id", deleteDocument);

export default router;
