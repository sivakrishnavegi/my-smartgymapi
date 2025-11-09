"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appConfigController_1 = require("../controllers/appConfigController");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/app-config:
 *   post:
 *     summary: Get tenant app configuration by domain
 *     tags:
 *       - App Config
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *             properties:
 *               domain:
 *                 type: string
 *                 example: "edunova.schoolerp.com"
 *                 description: The tenant domain
 *     responses:
 *       200:
 *         description: Tenant configuration fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tenant configuration fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     domain:
 *                       type: string
 *                       example: "edunova.schoolerp.com"
 *                     config:
 *                       type: object
 *                       properties:
 *                         tenantId:
 *                           type: string
 *                           example: "tenant_12345"
 *                         sassSetupCompleted:
 *                           type: boolean
 *                           example: true
 *                         isApiKeysVerified:
 *                           type: boolean
 *                           example: false
 *                         isUserActive:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Domain not provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "DOMAIN_REQUIRED"
 *                     message:
 *                       type: string
 *                       example: "Domain is required in request body"
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Internal server error
 */
router.post('/', appConfigController_1.getAppConfig);
exports.default = router;
