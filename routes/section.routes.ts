import { Router } from "express";
import {
  assignHomeroomTeacher,
  createSection,
  deleteSection,
  getSectionById,
  getSections,
  updateSection,
} from "../controllers/sectionController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sections
 *   description: Section management APIs
 *
 * components:
 *   schemas:
 *     Section:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64fc4d8b8af92b001ea9a3f1"
 *         tenantId:
 *           type: string
 *           example: "tenant123"
 *         schoolId:
 *           type: string
 *           example: "64fc3c8f8af92b001ea9a444"
 *         sectionName:
 *           type: string
 *           example: "Section A"
 *         sectionCode:
 *           type: string
 *           example: D1503
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-08-05T08:30:00Z"
 *       required:
 *         - tenantId
 *         - schoolId
 *         - sectionName
 */

/**
 * @swagger
 * /api/sections:
 *   post:
 *     summary: Create a new section
 *     tags: [Sections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Section'
 *     responses:
 *       201:
 *         description: Section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Section'
 *       400:
 *         description: Invalid input data
 */
router.post("/", protect, createSection);

/**
 * @swagger
 * /api/sections:
 *   get:
 *     summary: Get all sections with optional filters
 *     description: Retrieve a list of sections. You can filter by tenantId, schoolId, or classId.
 *     tags: [Sections]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter sections by tenant ID
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *         description: Filter sections by school ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter sections by class ID
 *     responses:
 *       200:
 *         description: A list of sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Section ID
 *                   name:
 *                     type: string
 *                     description: Name of the section
 *                   tenantId:
 *                     type: string
 *                   schoolId:
 *                     type: string
 *                   classId:
 *                     type: string
 *                   capacity:
 *                     type: integer
 *                   homeroomTeacherId:
 *                     type: string
 *                     description: ID of the homeroom teacher
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Creation timestamp
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/",protect, getSections);

/**
 * @swagger
 * /api/sections/{id}:
 *   get:
 *     summary: Get a single section by ID
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Section'
 *       404:
 *         description: Section not found
 */
router.get("/:id", getSectionById);

/**
 * @swagger
 * /api/sections/{id}:
 *   put:
 *     summary: Update a section
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Section'
 *     responses:
 *       200:
 *         description: Section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Section'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Section not found
 */
router.put("/:id", updateSection);

/**
 * @swagger
 * /api/sections/{id}:
 *   delete:
 *     summary: Delete a section
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section deleted successfully
 *       404:
 *         description: Section not found
 */
router.delete("/:id", deleteSection);

/**
 * @swagger
 * /api/sections/{id}/assign-teacher:
 *   put:
 *     summary: Assign a homeroom teacher to a section
 *     tags:
 *       - Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Section ID to which the teacher will be assigned
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacherId:
 *                 type: string
 *                 description: ID of the teacher to assign as homeroom teacher
 *             required:
 *               - teacherId
 *     responses:
 *       200:
 *         description: Teacher assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 section:
 *                   $ref: '#/components/schemas/Section'
 *       404:
 *         description: Section or teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.put("/:id/assign-teacher", assignHomeroomTeacher);


export default router;
