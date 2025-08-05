// routes/attendanceRoutes.ts
import express from 'express';
import { checkIn } from '../controllers/attendenceController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/attendance/checkin:
 *   post:
 *     summary: User check-in to gym
 *     description: Generates a check-in log for the user. Requires JWT token.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check-in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Check-in successful
 *                 attendance:
 *                   $ref: '#/components/schemas/Attendance'
 *       401:
 *         description: Unauthorized or invalid token
 */
router.post('/checkin', protect, checkIn);

export default router;
