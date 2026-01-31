import { Router } from "express";
import { 
  createSchool, 
  listSchools, 
  getSchoolById, 
  updateSchool, 
  deleteSchool 
} from "@academics/controllers/schoolController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Schools
 *   description: APIs for managing schools
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       properties:
 *         phone:
 *           type: string
 *           example: "+911234567890"
 *         email:
 *           type: string
 *           example: "info@school.com"
 *     AcademicYear:
 *       type: object
 *       properties:
 *         yearId:
 *           type: string
 *           example: "2025-2026"
 *         start:
 *           type: string
 *           format: date
 *           example: "2025-06-01"
 *         end:
 *           type: string
 *           format: date
 *           example: "2026-05-31"
 *         status:
 *           type: string
 *           enum: [active, archived]
 *           example: "active"
 *     School:
 *       type: object
 *       required:
 *         - tenantId
 *       properties:
 *         tenantId:
 *           type: string
 *           example: "tenant123"
 *         name:
 *           type: string
 *           example: "ABC High School"
 *         address:
 *           type: string
 *           example: "123 Street, City"
 *         contact:
 *           $ref: '#/components/schemas/Contact'
 *         academicYears:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AcademicYear'
 *         settings:
 *           type: object
 *           additionalProperties: true
 *           example: { theme: "blue" }
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-08-16T10:00:00Z"
 */

/**
 * @swagger
 * /api/schools:
 *   post:
 *     summary: Create a new school
 *     tags: [Schools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/School'
 *     responses:
 *       201:
 *         description: School created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "School created"
 *                 school:
 *                   $ref: '#/components/schemas/School'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "tenantId is required"
 */

/**
 * @swagger
 * /api/schools:
 *   get:
 *     summary: Get list of all schools
 *     tags: [Schools]
 *     responses:
 *       200:
 *         description: List of schools
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/School'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server error"
 */

/**
 * @swagger
 * /api/schools/{id}:
 *   get:
 *     summary: Get school by ID
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: School ID
 *         example: "64d5c8b2f5d3a2a1b0f0c123"
 *     responses:
 *       200:
 *         description: School details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/School'
 *       404:
 *         description: School not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "School not found"
 */

/**
 * @swagger
 * /api/schools/{id}:
 *   put:
 *     summary: Update a school by ID
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: School ID
 *         example: "64d5c8b2f5d3a2a1b0f0c123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/School'
 *     responses:
 *       200:
 *         description: School updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "School updated"
 *                 school:
 *                   $ref: '#/components/schemas/School'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid data"
 *       404:
 *         description: School not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "School not found"
 */

/**
 * @swagger
 * /api/schools/{id}:
 *   delete:
 *     summary: Delete a school by ID
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: School ID
 *         example: "64d5c8b2f5d3a2a1b0f0c123"
 *     responses:
 *       200:
 *         description: School deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "School deleted"
 *       404:
 *         description: School not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "School not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server error"
 */

router.post("/", createSchool);
router.get("/", listSchools);
router.get("/:id", getSchoolById);
router.put("/:id", updateSchool);
router.delete("/:id", deleteSchool);

export default router;
