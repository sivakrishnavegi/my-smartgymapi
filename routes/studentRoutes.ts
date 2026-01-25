import { Router } from "express";
import { getCompleteStudentDetails } from "../controllers/studentController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management and profile operations
 */

/**
 * @swagger
 * /api/students/{studentId}/complete-profile:
 *   get:
 *     summary: Get complete student profile and academic details
 *     description: Retrieves a comprehensive dataset for a student, including personal profile, class/section details, subjects, exams, and results.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the student record
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *       - in: query
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
 *     responses:
 *       200:
 *         description: Successfully fetched complete student details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       type: object
 *                       description: Personal details from Student record
 *                     academic:
 *                       type: object
 *                       description: Class, section, subjects and history
 *                     userAccount:
 *                       type: object
 *                       description: Linked user account details
 *                     exams:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Relevant exams for the student's class
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Exam results for the student
 *                     seatingPlan:
 *                       type: array
 *                       description: Currently returns empty array
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.get("/:studentId/complete-profile", protect, getCompleteStudentDetails);

export default router;
