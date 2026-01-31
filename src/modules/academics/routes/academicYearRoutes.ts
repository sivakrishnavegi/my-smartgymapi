import express from "express";
import {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
} from "@academics/controllers/academicYearController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AcademicYear
 *   description: API for managing academic years
 */

/**
 * @swagger
 * /api/academic-years:
 *   post:
 *     summary: Create a new academic year
 *     tags: [AcademicYear]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "2024-2025"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-31"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Academic year created successfully
 */
router.post("/", createAcademicYear);

/**
 * @swagger
 * /api/academic-years:
 *   get:
 *     summary: Get all academic years
 *     tags: [AcademicYear]
 *     responses:
 *       200:
 *         description: List of academic years
 */
router.get("/", getAllAcademicYears);

/**
 * @swagger
 * /api/academic-years/{id}:
 *   get:
 *     summary: Get a single academic year by ID
 *     tags: [AcademicYear]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Academic year ID
 *     responses:
 *       200:
 *         description: Academic year data
 *       404:
 *         description: Academic year not found
 */
router.get("/:id", getAcademicYear);

/**
 * @swagger
 * /api/academic-years/{id}:
 *   put:
 *     summary: Update an academic year
 *     tags: [AcademicYear]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Academic year ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Academic year updated
 *       404:
 *         description: Academic year not found
 */
router.put("/:id", updateAcademicYear);

/**
 * @swagger
 * /api/academic-years/{id}:
 *   delete:
 *     summary: Delete an academic year
 *     tags: [AcademicYear]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Academic year ID
 *     responses:
 *       200:
 *         description: Academic year deleted
 *       404:
 *         description: Academic year not found
 */
router.delete("/:id", deleteAcademicYear);

export default router;
