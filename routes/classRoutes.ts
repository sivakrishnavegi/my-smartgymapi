import { Router } from "express";
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../controllers/classController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: Class management endpoints
 */

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - schoolId
 *               - className
 *             properties:
 *               tenantId:
 *                 type: string
 *               schoolId:
 *                 type: string
 *               className:
 *                 type: string
 *               classTeacher:
 *                 type: string
 *                 description: class teacher ID
 *               description:
 *                 type: string
 *               medium:
 *                 type: string
 *               shift:
 *                 type: string
 *                 enum: [Morning, Evening]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Duplicate class code
 */
router.post("/", createClass);

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *       - in: query
 *         name: "params[tenantId]"
 *         schema:
 *           type: string
 *         description: Tenant ID (nested format)
 *       - in: query
 *         name: "params[schoolId]"
 *         schema:
 *           type: string
 *         description: School ID (nested format)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: "params[page]"
 *         schema:
 *           type: integer
 *         description: Page number (nested format)
 *       - in: query
 *         name: "params[limit]"
 *         schema:
 *           type: integer
 *         description: Number of items per page (nested format)
 *     responses:
 *       200:
 *         description: List of classes
 */
router.get("/", getClasses);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get a class by ID
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class found
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Class not found
 */
router.get("/:id", getClassById);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Update a class by ID
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class updated
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Class not found
 *       409:
 *         description: Duplicate class code
 */
router.put("/:id", updateClass);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Delete a class by ID
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class deleted
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Class not found
 */
router.delete("/:id", deleteClass);

export default router;
