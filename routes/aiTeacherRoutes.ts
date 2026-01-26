import { Router } from "express";
import { chatWithAi, askAi, getAiConfiguration, updateAiConfiguration, uploadKnowledge, getIngestionStatus } from "../controllers/aiTeacherController";
import { protect } from "../middlewares/authMiddleware";
import { validate, validateQuery } from "../middlewares/validateMiddleware";
import { askAiSchema, chatAiSchema, updateAiConfigSchema, getAiConfigQuerySchema } from "../validators/aiTeacherValidators";

const router = Router();

// Protect all AI routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: AI Teacher
 *   description: AI-powered teaching assistant module
 */

/**
 * @swagger
 * /api/ai-teacher/chat:
 *   post:
 *     summary: Chat with AI Teacher
 *     tags: [AI Teacher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Explain Newton's second law"
 *               subjectId:
 *                 type: string
 *                 description: Optional subject context
 *               topicId:
 *                 type: string
 *                 description: Optional topic context
 *               sessionId:
 *                 type: string
 *                 description: Continuation of a specific chat session
 *     responses:
 *       200:
 *         description: AI Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: string
 *                 sessionId:
 *                   type: string
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/chat", validate(chatAiSchema), chatWithAi);

/**
 * @swagger
 * /api/ai-teacher/ask:
 *   post:
 *     summary: Industry-standard AI query with SaaS billing
 *     tags: [AI Teacher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - input
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "biology"
 *               input:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "text"
 *                   content:
 *                     type: string
 *                     example: "Explain photosynthesis"
 *               context:
 *                 type: object
 *                 properties:
 *                   chapter:
 *                     type: string
 *                   language:
 *                     type: string
 *                     example: "en"
 *               options:
 *                 type: object
 *                 properties:
 *                   difficulty:
 *                     type: string
 *                     example: "simple"
 *                   use_examples:
 *                     type: boolean
 *               client_meta:
 *                 type: object
 *               tenantId:
 *                 type: string
 *               schoolId:
 *                 type: string
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI Response and remaining tokens
 *       403:
 *         description: AI disabled or tokens exhausted
 *       500:
 *         description: Server error
 */
router.post("/ask", validate(askAiSchema), askAi);

/**
 * @swagger
 * /api/ai-teacher/config:
 *   get:
 *     summary: Get AI configuration for the school
 *     tags: [AI Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: schoolId
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI Configuration details
 *       404:
 *         description: Config not found
 */
router.get("/config", validateQuery(getAiConfigQuerySchema), getAiConfiguration);

/**
 * @swagger
 * /api/ai-teacher/config:
 *   post:
 *     summary: Update AI configuration for the school (Admins only)
 *     tags: [AI Teacher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenantId:
 *                 type: string
 *               schoolId:
 *                 type: string
 *               isEnabled:
 *                 type: boolean
 *               subscription:
 *                 type: object
 *                 properties:
 *                   tier:
 *                     type: string
 *                     enum: [free, basic, premium]
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *               tokenManagement:
 *                 type: object
 *                 properties:
 *                   monthlyLimit:
 *                     type: number
 *               config:
 *                 type: object
 *                 properties:
 *                   modelVendor:
 *                     type: string
 *                   defaultModel:
 *                     type: string
 *                   temperature:
 *                     type: number
 *     responses:
 *       200:
 *         description: AI Configuration updated successfully
 *       500:
 *         description: Server error
 */
router.post("/config", validate(updateAiConfigSchema), updateAiConfiguration);

/**
 * @swagger
 * /api/ai-teacher/knowledge/upload:
 *   post:
 *     summary: Upload knowledge document (Teacher/Admin only)
 *     tags: [AI Teacher]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               classId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               chapter:
 *                 type: string
 *     responses:
 *       202:
 *         description: File accepted for processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 jobId:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post("/knowledge/upload", uploadKnowledge);

/**
 * @swagger
 * /api/ai-teacher/knowledge/status/{jobId}:
 *   get:
 *     summary: Get status of ingestion job
 *     tags: [AI Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 state:
 *                   type: string
 *                   enum: [waiting, active, completed, failed]
 *                 progress:
 *                   type: number
 *       404:
 *         description: Job not found
 */
router.get("/knowledge/status/:jobId", getIngestionStatus);

export default router;
