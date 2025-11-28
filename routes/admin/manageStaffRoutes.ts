import express from "express";
import { addNewStaffMemberToSchool } from "../../controllers/admin/manageStaff";

const router = express.Router();

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
router.post("/addNewStaffMemberToSchool", addNewStaffMemberToSchool);

export default router;
