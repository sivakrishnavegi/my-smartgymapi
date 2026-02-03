import { Router } from "express";
import {
  createTenant,
  deleteTenant,
  getTenantByDomainId,
  getTenantById,
  issueApiKey,
  listTenants,
  revokeApiKey,
  updateSubscription,
  updateTenant,
  verifyApiKey,
  configureSchool,
  schoolConfigSchema
} from "../controllers/tenantController";
import { protect } from "../middlewares/authMiddleware";
import { apiKeyProtect } from "../middlewares/apiKeyMiddleware";
import { validate } from "../middlewares/validateMiddleware";

const router = Router();



/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management & subscription APIs
 */

/**
 * @swagger
 * /api/tenants/d/{domainId}:
 *   get:
 *     summary: Get tenant domain by URL
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: domainId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant details
 */

router.get("/d/:domainId", getTenantByDomainId);


/**
 * @swagger
 * /api/tenants:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tenant'
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *   get:
 *     summary: List all tenants
 *     tags: [Tenants]
 *     responses:
 *       200:
 *         description: List of tenants
 */
router.post("/", createTenant);
router.get("/", protect, listTenants);



/**
 * @swagger
 * /api/tenants/{tenantId}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant details
 *   put:
 *     summary: Update a tenant
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant updated
 *   delete:
 *     summary: Delete a tenant
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Tenant deleted
 */
router.get("/:tenantId", getTenantById);
router.put("/:tenantId", updateTenant);
router.delete("/:tenantId", deleteTenant);


/**
 * @swagger
 * /api/tenants/{tenantId}/api-keys:
 *   post:
 *     summary: Issue a new API key for a tenant
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the tenant
 *     responses:
 *       201:
 *         description: API key issued successfully
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Server error
 */
router.post("/:tenantId/api-keys", protect, issueApiKey);

/**
 * @swagger
 *  /api/tenants/{tenantId}/api-keys/{keyHash}/revoke:
 *   put:
 *     summary: Revoke an API key
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: keyHash
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key revoked
 */
router.put("/:tenantId/api-keys/:keyHash/revoke", revokeApiKey);

/**
 * @swagger
 * /api/tenants/{tenantId}/subscription:
 *   put:
 *     summary: Update subscription for a tenant
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription updated
 */
router.put("/:tenantId/subscription", updateSubscription);

/**
 * @swagger
 * /api/tenants/verify-keys:
 *   post:
 *     summary: Verify an issued API key for a tenant
 *     description: |
 *       Verifies if the provided API key is valid, not revoked, and belongs to the given tenant.  
 *       Requires user authentication (JWT in Authorization header).
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenantId:
 *                 type: string
 *                 example: tenant_12345
 *               apiKey:
 *                 type: string
 *                 example: sk_live_abcd1234_deadbeefcafefeed12345678
 *     responses:
 *       200:
 *         description: API key is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 tenantId:
 *                   type: string
 *                   example: tenant_12345
 *                 issuedBy:
 *                   type: string
 *                   example: 64f8b12345a1e2c3d4e5f678
 *                 issuedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing apiKey or tenantId
 *       403:
 *         description: API key revoked or invalid
 *       404:
 *         description: Tenant or API key not found
 *       500:
 *         description: Internal server error
 */
router.post("/verify-keys", protect, verifyApiKey);

/**
 * @swagger
 * /api/tenants/school-config:
 *   post:
 *     summary: Configure school settings (Multi-tenant SaaS)
 *     tags: [Tenants]
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-school-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolConfig'
 *     responses:
 *       200:
 *         description: School configured successfully
 */
router.post("/school-config", apiKeyProtect, validate(schoolConfigSchema), configureSchool);

export default router;
