import { Router } from "express";
import { 
  createTenant, 
  getTenantById, 
  updateTenant, 
  deleteTenant, 
  listTenants,
  issueApiKey,
  revokeApiKey,
  updateSubscription
} from "../controllers/tenantController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management & subscription APIs
 */

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
router.get("/", listTenants);

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
 *     summary: Issue a new API key for tenant
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: API key issued
 */
router.post("/:tenantId/api-keys", issueApiKey);

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

export default router;
