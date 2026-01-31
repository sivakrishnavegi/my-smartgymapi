import { Router } from "express";
import { getControlTower, toggleAiStatus } from "@ai/controllers/aiSubjectController";
import { protect } from "@shared/middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/ai-subjects/control-tower:
 *   get:
 *     summary: Get AI Control Tower dashboard data for subjects
 *     tags: [AI Subject Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *       - in: query
 *         name: schoolId
 *         required: true
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/control-tower", protect, getControlTower);

/**
 * @swagger
 * /api/ai-subjects/{subjectId}/toggle:
 *   patch:
 *     summary: Toggle AI Active status for a subject
 *     tags: [AI Subject Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenantId: { type: string }
 *               schoolId: { type: string }
 *               isActive: { type: boolean }
 *               enabledClasses: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch("/:subjectId/toggle", protect, toggleAiStatus);

export default router;
