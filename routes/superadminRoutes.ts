import express from "express";
import {
  createSuperAdmin,
  getSuperAdmin,
  superAdminLogin,
} from "../controllers/superadmin/TenantSuperAdminController";
import { addUser, getAllUsers } from "../controllers/superadmin/userTasksByAdminControler";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TenantSuperAdmin
 *   description: Operations for managing tenant superadmins
 */

/**
 * @swagger
 * /api/superadmin/listallusers:
 *   get:
 *     summary: Get all users with pagination, filtering, and sorting
 *     description: Fetch a list of users. Supports pagination, filtering by userType and status, search, and sorting.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [admin, superadmin, guest, teacher, student, librarian, guardian]
 *         description: Filter users by userType
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter users by account status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by firstName, lastName, email, or username
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get("/listallusers", protect, getAllUsers);


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


/**
 * @swagger
 * /api/superadmin/users:
 *   post:
 *     summary: Create a new user by super admin
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenantId:
 *                 type: string
 *                 example: "03254a3f-8c89-4a32-ae74-75e68f8062f1"
 *               schoolId:
 *                 type: string
 *                 example: "68a92f1ca69d89189e2f6df6"
 *               userType:
 *                 type: string
 *                 enum: [admin, superadmin, teacher, student, librarian, guardian, guest]
 *                 example: "admin"
 *               profile:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: "Siva"
 *                   lastName:
 *                     type: string
 *                     example: "Vegi"
 *                   dob:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-08-13T18:30:00.000Z"
 *                   gender:
 *                     type: string
 *                     enum: [male, female, other]
 *                     example: "male"
 *                   photoUrl:
 *                     type: string
 *                   address:
 *                     type: string
 *                   contact:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: "admin@gmail.com"
 *                       phone:
 *                         type: string
 *                         example: "7696562188"
 *               account:
 *                 type: object
 *                 properties:
 *                   primaryEmail:
 *                     type: string
 *                     example: "admin@gmail.com"
 *                   username:
 *                     type: string
 *                     example: "akhira"
 *                   passwordHash:
 *                     type: string
 *                     example: "hashed_password_here"
 *                   status:
 *                     type: string
 *                     enum: [active, inactive, suspended]
 *                     example: "active"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *               linkedStudentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               employment:
 *                 type: object
 *                 properties:
 *                   staffId:
 *                     type: string
 *                     example: "tch1234"
 *                   deptId:
 *                     type: string
 *                     example: "dept1234"
 *                   hireDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-08-19T18:30:00.000Z"
 *               enrollment:
 *                 type: object
 *                 properties:
 *                   studentId:
 *                     type: string
 *                     example: "STUDENT1234"
 *                   classId:
 *                     type: string
 *                     example: "CLASSVA"
 *                   sectionId:
 *                     type: string
 *                     example: "SECTIONB"
 *                   regNo:
 *                     type: string
 *                     example: ""
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-08-24T10:16:23.331Z"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 *       500:
 *         description: Server error
 */
router.post("/users", addUser);



export default router;
