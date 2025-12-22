"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const manageStaff_1 = require("../../controllers/admin/manageStaff");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   - name: Staff Management
 *     description: APIs for managing staff members under a tenant and school
 */
/**
 * @swagger
 * /api/admin/addNewStaffMemberToSchool:
 *   post:
 *     summary: Add a new staff member to a school
 *     tags:
 *       - Staff Management
 *     description: >
 *       Creates a new staff member (teacher or supporting staff) under a tenant and school.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - schoolId
 *               - profile
 *               - role
 *               - account
 *             properties:
 *               tenantId:
 *                 type: string
 *               schoolId:
 *                 type: string
 *
 *               profile:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   gender:
 *                     type: string
 *                   dob:
 *                     type: string
 *                     format: date
 *
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *               staffType:
 *                 type: string
 *
 *               account:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   username:
 *                     type: string
 *                   password:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   permissions:
 *                     type: array
 *                     items:
 *                       type: string
 *
 *     responses:
 *       201:
 *         description: Staff member created successfully
 *       400:
 *         description: Validation error or duplicate email
 *       404:
 *         description: Tenant or school not found
 *       500:
 *         description: Internal server error
 */
router.post("/addNewStaffMemberToSchool", manageStaff_1.addNewStaffMemberToSchool);
/**
 * @swagger
 * /api/admin/getStaffMembers:
 *   get:
 *     summary: Get list of staff members for a school
 *     description: |
 *       Returns paginated staff members for a given tenant and school.
 *       Supports filters like role.
 *     tags:
 *       - Staff Management
 *
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *         example: 66f013bc395e410b8b6ef321
 *
 *       - in: query
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
 *         example: 66ff12cd5a33400998eec442
 *
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter staff by role (e.g., TEACHER, ADMIN)
 *         example: TEACHER
 *
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: Page number (pagination)
 *         example: 1
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *         example: 10
 *
 *     responses:
 *       200:
 *         description: Staff members fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   example: 42
 *                 page:
 *                   type: number
 *                   example: 1
 *                 limit:
 *                   type: number
 *                   example: 10
 *                 totalPages:
 *                   type: number
 *                   example: 5
 *                 staff:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "6701aa99b33ab23d887fd119"
 *                       name:
 *                         type: string
 *                         example: "Arjun Reddy"
 *                       email:
 *                         type: string
 *                         example: "arjun@school.com"
 *                       role:
 *                         type: string
 *                         example: "TEACHER"
 *                       department:
 *                         type: string
 *                         example: "Science"
 *
 *       400:
 *         description: Missing or invalid parameters
 *
 *       500:
 *         description: Internal server error
 */
router.get("/getStaffMembers", manageStaff_1.listStaffMembersForSchool);
exports.default = router;
