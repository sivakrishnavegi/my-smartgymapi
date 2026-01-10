
import { Router } from "express";
import { createSubject, getSubjects, updateSubject, deleteSubject } from "../controllers/subjectController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Subjects
 *   description: Subject management APIs
 */

/**
 * @swagger
 * /api/subjects:
 *   post:
 *     summary: Create a new subject for a class
 *     tags: [Subjects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId, schoolId, classId, sectionId, name, code]
 *             properties:
 *               tenantId: { type: string }
 *               schoolId: { type: string }
 *               classId: { type: string }
 *               sectionId: { type: string }
 *               name: { type: string }
 *               code: { type: string }
 *               creditHours: { type: number }
 *     responses:
 *       201: { description: Subject created }
 *       400: { description: Invalid input }
 *       409: { description: Subject code exists }
 */
router.post("/", protect, createSubject);

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Get subjects for a class
 *     tags: [Subjects]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: schoolId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: classId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: sectionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of subjects }
 */
router.get("/", protect, getSubjects);

/**
 * @swagger
 * /api/subjects/{id}:
 *   patch:
 *     summary: Update a subject
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               creditHours: { type: number }
 *     responses:
 *       200: { description: Subject updated }
 */
router.patch("/:id", protect, updateSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Subject deleted }
 */
router.delete("/:id", protect, deleteSubject);

export default router;
