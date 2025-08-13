"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/attendanceRoutes.ts
const express_1 = __importDefault(require("express"));
const attendenceController_1 = require("../controllers/attendenceController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
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
router.post('/checkin', authMiddleware_1.protect, attendenceController_1.checkIn);
exports.default = router;
