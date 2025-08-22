import express from "express";
import {
  createSuperAdmin,
  getSuperAdmin,
  superAdminLogin,
} from "../controllers/superadmin/TenantSuperAdminController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TenantSuperAdmin
 *   description: Operations for managing tenant superadmins
 */

/**
 * @swagger
 * /api/superadmin/create:
 *   post:
 *     summary: Create a superadmin for a tenant
 *     tags: [TenantSuperAdmin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - email
 *               - password
 *             properties:
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID
 *               schoolId:
 *                 type: string
 *                 description: Optional school ID reference
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: SuperAdmin created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Tenant or School not found
 *       409:
 *         description: SuperAdmin already exists
 */
router.post("/create", createSuperAdmin);

/**
 * @swagger
 * /api/superadmin/login:
 *   post:
 *     summary: SuperAdmin login
 *     tags: [TenantSuperAdmin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - email
 *               - password
 *             properties:
 *               tenantId:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: SuperAdmin not found
 */
router.post("/login", superAdminLogin);

/**
 * @swagger
 * /api/superadmin/{tenantId}:
 *   get:
 *     summary: Get superadmin info by tenant ID
 *     tags: [TenantSuperAdmin]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: true
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: SuperAdmin info retrieved
 *       400:
 *         description: Missing tenantId
 *       404:
 *         description: SuperAdmin not found
 */
router.get("/:tenantId", getSuperAdmin);

export default router;
