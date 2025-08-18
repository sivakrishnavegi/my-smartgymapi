// src/routes/event.routes.ts
import { Router } from "express";
import { createEvent, getEvents } from "../controllers/eventController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management for the school ERP
 */

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - endDate
 *               - createdBy
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Annual Sports Day"
 *               description:
 *                 type: string
 *                 example: "Sports event for all classes"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-01T10:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-01T16:00:00Z"
 *               bannerUrl:
 *                 type: string
 *                 example: "https://example.com/banner.jpg"
 *               createdBy:
 *                 type: string
 *                 example: "64d3f123abc4567890def123"
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request / validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, createEvent);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of all events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       500:
 *         description: Server error
 */
router.get("/", getEvents);

export default router;
