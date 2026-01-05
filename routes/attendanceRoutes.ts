// routes/attendanceRoutes.ts
import express from 'express';
import { checkIn, getStudentAttendance, markBulkAttendance, getSectionAttendance } from '../controllers/attendenceController';
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

/**
 * @swagger
 * /api/attendance/student/{studentId}:
 *   get:
 *     summary: Get specific student attendance records
 *     description: Retrieves attendance records for a student based on duration, month, or academic year. Supports expansion of related documents.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the student
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant ID
 *       - in: query
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2025)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: session
 *         schema:
 *           type: string
 *         description: session (e.g. 2025-26)
 *       - in: query
 *         name: expand
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to expand (studentId, classId, sectionId, schoolId, markedBy)
 *     responses:
 *       200:
 *         description: Successfully fetched attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentAttendance'
 *                 count:
 *                   type: integer
 *       400:
 *         description: Missing required specialized parameters or invalid ID format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/student/:studentId', protect, getStudentAttendance);

/**
 * @swagger
 * /api/attendance/mark-bulk:
 *   post:
 *     summary: Mark attendance for all students in a specific section
 *     description: Bulk records or updates attendance for students in a specific section. Requires JWT token.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - schoolId
 *               - classId
 *               - sectionId
 *               - date
 *               - session
 *               - attendanceData
 *             properties:
 *               tenantId:
 *                 type: string
 *               schoolId:
 *                 type: string
 *               classId:
 *                 type: string
 *               sectionId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               session:
 *                 type: string
 *                 example: "2025-26"
 *               attendanceData:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - studentId
 *                     - status
 *                   properties:
 *                     studentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [Present, Absent, Late, Excuse]
 *                     remarks:
 *                       type: string
 *     responses:
 *       200:
 *         description: Attendance marked successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post('/mark-bulk', protect, markBulkAttendance);

/**
 * @swagger
 * /api/attendance/section/{sectionId}:
 *   get:
 *     summary: Get attendance data for a specific section with pagination
 *     description: Retrieves attendance records for all students in a section for a specific date. Supports pagination and filtering.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the section
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant ID
 *       - in: query
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *         description: The school ID
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The class ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Attendance date (YYYY-MM-DD)
 *       - in: query
 *         name: session
 *         schema:
 *           type: string
 *         description: Academic session (e.g., 2025-26)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Present, Absent, Late, Excuse]
 *         description: Filter by attendance status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Successfully fetched section attendance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentAttendance'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalRecords:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Missing required parameters or invalid ID format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/section/:sectionId', protect, getSectionAttendance);

export default router;
