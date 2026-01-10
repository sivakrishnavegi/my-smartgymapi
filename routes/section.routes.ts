import { Router } from "express";
import {
  assignHomeroomTeacher,
  createSection,
  deleteSection,
  getSectionById,
  getSections,
  updateSection,
  getSectionsByClass,
  updateSectionsByClass,
  getStudentsBySection,
  addStudentToSection,
  getStudent,
  assignSubjects,
  getSectionSubjects
} from "../controllers/sectionController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sections
 *   description: Section management APIs
 *
 * components:
 *   schemas:
 *     Section:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64fc4d8b8af92b001ea9a3f1"
 *         tenantId:
 *           type: string
 *           example: "tenant123"
 *         schoolId:
 *           type: string
 *           example: "64fc3c8f8af92b001ea9a444"
 *         sectionName:
 *           type: string
 *           example: "Section A"
 *         sectionCode:
 *           type: string
 *           example: D1503
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-08-05T08:30:00Z"
 *       required:
 *         - tenantId
 *         - schoolId
 *         - sectionName
 */

/**
 * @swagger
 * /api/sections:
 *   post:
 *     summary: Create a new section
 *     tags: [Sections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Section'
 *     responses:
 *       201:
 *         description: Section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Section'
 *       400:
 *         description: Invalid input data
 */
router.post("/", protect, createSection);

/**
 * @swagger
 * /api/sections:
 *   get:
 *     summary: Get all sections with optional filters
 *     description: Retrieve a list of sections. You can filter by tenantId, schoolId, or classId.
 *     tags: [Sections]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter sections by tenant ID
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: string
 *         description: Filter sections by school ID
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter sections by class ID
 *     responses:
 *       200:
 *         description: A list of sections
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Section ID
 *                   name:
 *                     type: string
 *                     description: Name of the section
 *                   tenantId:
 *                     type: string
 *                   schoolId:
 *                     type: string
 *                   classId:
 *                     type: string
 *                   capacity:
 *                     type: integer
 *                   homeroomTeacherId:
 *                     type: string
 *                     description: ID of the homeroom teacher
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Creation timestamp
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/", protect, getSections);

/**
 * @swagger
 * /api/sections/{id}:
 *   get:
 *     summary: Get complete section information by ID
 *     description: Retrieve detailed section information including homeroom teacher, students, and school details. Requires tenant and school validation.
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID (MongoDB ObjectId)
 *         example: "64fc4d8b8af92b001ea9a3f1"
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID for ownership validation
 *         example: "tenant123"
 *       - in: query
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID (MongoDB ObjectId) for ownership validation
 *         example: "64fc3c8f8af92b001ea9a444"
 *     responses:
 *       200:
 *         description: Section details with complete information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Section fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64fc4d8b8af92b001ea9a3f1"
 *                     tenantId:
 *                       type: string
 *                       example: "tenant123"
 *                     schoolId:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         code:
 *                           type: string
 *                         address:
 *                           type: string
 *                     sectionName:
 *                       type: string
 *                       example: "Section A"
 *                     sectionCode:
 *                       type: string
 *                       example: "D1503"
 *                     description:
 *                       type: string
 *                       example: "Morning shift section"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     homeroomTeacherId:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         userType:
 *                           type: string
 *                           example: "teacher"
 *                         profile:
 *                           type: object
 *                           properties:
 *                             firstName:
 *                               type: string
 *                               example: "John"
 *                             lastName:
 *                               type: string
 *                               example: "Doe"
 *                             photoUrl:
 *                               type: string
 *                               example: "https://example.com/photo.jpg"
 *                             contact:
 *                               type: object
 *                               properties:
 *                                 phone:
 *                                   type: string
 *                                   example: "+1234567890"
 *                                 email:
 *                                   type: string
 *                                   example: "teacher@example.com"
 *                         account:
 *                           type: object
 *                           properties:
 *                             primaryEmail:
 *                               type: string
 *                               example: "teacher@school.com"
 *                         employment:
 *                           type: object
 *                           properties:
 *                             staffId:
 *                               type: string
 *                             deptId:
 *                               type: string
 *                             hireDate:
 *                               type: string
 *                               format: date
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         profile:
 *                           type: object
 *                           properties:
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                         account:
 *                           type: object
 *                           properties:
 *                             primaryEmail:
 *                               type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-05T08:30:00Z"
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           admissionNo:
 *                             type: string
 *                           rollNo:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           middleName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           dob:
 *                             type: string
 *                             format: date
 *                           gender:
 *                             type: string
 *                             enum: [Male, Female, Other]
 *                           contact:
 *                             type: object
 *                             properties:
 *                               email:
 *                                 type: string
 *                               phone:
 *                                 type: string
 *                           status:
 *                             type: string
 *                             enum: [Active, Inactive, Transferred, Graduated]
 *                     studentCount:
 *                       type: integer
 *                       example: 25
 *       400:
 *         description: Bad request - Invalid ID format or missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "tenantId and schoolId are required!"
 *       403:
 *         description: Forbidden - Unauthorized access (tenant/school mismatch)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Section does not belong to this tenant!"
 *       404:
 *         description: Section or school not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Section not found!"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server Error"
 */
router.get("/:id", getSectionById);

/**
 * @swagger
 * /api/sections/{id}:
 *   put:
 *     summary: Update a section
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Section'
 *     responses:
 *       200:
 *         description: Section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Section'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Section not found
 */
router.put("/:id", protect, updateSection);

/**
 * @swagger
 * /api/sections/{id}:
 *   delete:
 *     summary: Delete a section
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section deleted successfully
 *       404:
 *         description: Section not found
 */
router.delete("/:id", protect, deleteSection);

/**
 * @swagger
 * /api/sections/{id}/assign-teacher:
 *   put:
 *     summary: Assign a homeroom teacher to a section
 *     tags:
 *       - Sections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Section ID to which the teacher will be assigned
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacherId:
 *                 type: string
 *                 description: ID of the teacher to assign as homeroom teacher
 *             required:
 *               - teacherId
 *     responses:
 *       200:
 *         description: Teacher assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 section:
 *                   $ref: '#/components/schemas/Section'
 *       404:
 *         description: Section or teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
router.put("/:id/assign-teacher", assignHomeroomTeacher);

/**
 * @swagger
 * /api/sections/class/{classId}:
 *   get:
 *     summary: Get all sections assigned to a particular class
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: List of sections for the class
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
 *                     $ref: '#/components/schemas/Section'
 *       400:
 *         description: Invalid class ID
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.get("/class/:classId", getSectionsByClass);

/**
 * @swagger
 * /api/sections/class/{classId}:
 *   put:
 *     summary: Update sections for a particular class
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sections
 *             properties:
 *               tenantId:
 *                 type: string
 *               schoolId:
 *                 type: string
 *               sections:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of Section ObjectIds
 *     responses:
 *       200:
 *         description: Sections updated successfully
 *       400:
 *         description: Invalid input or missing fields
 *       403:
 *         description: Unauthorized access (tenant/school mismatch)
 *       404:
 *         description: Class or Section not found
 *       500:
 *         description: Internal server error
 */
router.put("/class/:classId", protect, updateSectionsByClass);

/**
 * @swagger
 * /api/sections/{sectionId}/students:
 *   get:
 *     summary: Get all students in a specific section
 *     description: Retrieve a paginated list of active students belonging to a specific section with optional search functionality. Requires tenant, school, and class validation.
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID (MongoDB ObjectId)
 *         example: "64fc4d8b8af92b001ea9a3f1"
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID for ownership validation
 *         example: "tenant123"
 *       - in: query
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID (MongoDB ObjectId) for ownership validation
 *         example: "64fc3c8f8af92b001ea9a444"
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID (MongoDB ObjectId) for ownership validation
 *         example: "64fc3c8f8af92b001ea9a555"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter students by name, admission number, or roll number
 *         example: "John"
 *     responses:
 *       200:
 *         description: Students fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Students fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "64fc5d8b8af92b001ea9a666"
 *                           admissionNo:
 *                             type: string
 *                             example: "ADM2024001"
 *                           rollNo:
 *                             type: string
 *                             example: "1"
 *                           firstName:
 *                             type: string
 *                             example: "John"
 *                           middleName:
 *                             type: string
 *                             example: "Michael"
 *                           lastName:
 *                             type: string
 *                             example: "Doe"
 *                           dob:
 *                             type: string
 *                             format: date
 *                             example: "2010-05-15"
 *                           gender:
 *                             type: string
 *                             enum: [Male, Female, Other]
 *                             example: "Male"
 *                           contact:
 *                             type: object
 *                             properties:
 *                               phone:
 *                                 type: string
 *                                 example: "+1234567890"
 *                               email:
 *                                 type: string
 *                                 example: "john.doe@example.com"
 *                               address:
 *                                 type: object
 *                                 properties:
 *                                   line1:
 *                                     type: string
 *                                   line2:
 *                                     type: string
 *                                   city:
 *                                     type: string
 *                                   state:
 *                                     type: string
 *                                   pincode:
 *                                     type: string
 *                                   country:
 *                                     type: string
 *                           guardians:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 relation:
 *                                   type: string
 *                                   enum: [Father, Mother, Guardian]
 *                                 phone:
 *                                   type: string
 *                                 email:
 *                                   type: string
 *                                 occupation:
 *                                   type: string
 *                                 address:
 *                                   type: string
 *                           status:
 *                             type: string
 *                             enum: [Active, Inactive, Transferred, Graduated]
 *                             example: "Active"
 *                           academic:
 *                             type: object
 *                             properties:
 *                               currentClass:
 *                                 type: string
 *                               currentSection:
 *                                 type: string
 *                               history:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                           documents:
 *                             type: object
 *                             properties:
 *                               photo:
 *                                 type: string
 *                               birthCertificate:
 *                                 type: string
 *                               idProof:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         totalRecords:
 *                           type: integer
 *                           example: 25
 *                         limit:
 *                           type: integer
 *                           example: 10
 *       400:
 *         description: Bad request - Invalid ID format, missing required parameters, or section mismatch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Section does not belong to the specified class!"
 *       403:
 *         description: Forbidden - Unauthorized access (tenant/school/class mismatch)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Section does not belong to this tenant!"
 *       404:
 *         description: Section, class, or school not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Section not found!"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server Error"
 */
router.get("/:sectionId/students", protect, getStudentsBySection);

/**
 * @swagger
 * /api/sections/{sectionId}/students:
 *   post:
 *     summary: Add a student to a section
 *     description: Create a new student and assign them to a specific section. Requires tenant, school, class, and section validation.
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - schoolId
 *               - classId
 *               - firstName
 *               - dob
 *               - gender
 *               - admissionNo
 *             properties:
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID (UUID)
 *               schoolId:
 *                 type: string
 *                 description: School ID (ObjectId)
 *               classId:
 *                 type: string
 *                 description: Class ID (ObjectId)
 *               admissionNo:
 *                 type: string
 *               rollNo:
 *                 type: string
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               contact:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                   address:
 *                     type: object
 *                     properties:
 *                       line1: { type: string }
 *                       line2: { type: string }
 *                       city: { type: string }
 *                       state: { type: string }
 *                       pincode: { type: string }
 *                       country: { type: string }
 *               guardians:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     relation: { type: string, enum: [Father, Mother, Guardian] }
 *                     phone: { type: string }
 *                     email: { type: string }
 *                     occupation: { type: string }
 *                     address: { type: string }
 *               documents:
 *                 type: object
 *                 properties:
 *                   photo: { type: string }
 *                   birthCertificate: { type: string }
 *                   idProof: { type: string }
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Transferred, Graduated]
 *                 default: Active
 *               admissionDate:
 *                 type: string
 *                 format: date
 *                 default: Current Date
 *     responses:
 *       201:
 *         description: Student added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Student added successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Bad request - Missing fields or invalid IDs
 *       404:
 *         description: School, Class, or Section not found
 *       409:
 *         description: Student with admission number already exists
 *       500:
 *         description: Internal server error
 */
router.post("/:sectionId/students", protect, addStudentToSection);

/**
 * @swagger
 * /api/sections/{sectionId}/students/{studentId}:
 *   get:
 *     summary: Get details of a specific student
 *     description: Retrieve detailed information about a specific student. Requires tenant, school, class, and section validation.
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Section ID (MongoDB ObjectId)
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID (MongoDB ObjectId)
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID (UUID)
 *       - in: query
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID (ObjectId)
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID (ObjectId)
 *     responses:
 *       200:
 *         description: Student fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Student fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Bad request - Missing fields or invalid IDs
 *       404:
 *         description: Student, School, Class, or Section not found
 *       500:
 *         description: Internal server error
 */
router.get("/:sectionId/students/:studentId", protect, getStudent);

/**
 * @swagger
 * /api/sections/{sectionId}/subjects:
 *   post:
 *     summary: Assign subjects to a section with teachers
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId, schoolId, subjects]
 *             properties:
 *               tenantId: { type: string }
 *               schoolId: { type: string }
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     subjectId: { type: string }
 *                     teacherId: { type: string }
 *     responses:
 *       200: { description: Subjects assigned successfully }
 *       400: { description: Invalid input }
 */
router.post("/:sectionId/subjects", protect, assignSubjects);

/**
 * @swagger
 * /api/sections/{sectionId}/subjects:
 *   get:
 *     summary: Get subjects assigned to a section
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: schoolId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Subjects fetched successfully }
 *       404: { description: Section not found }
 */
router.get("/:sectionId/subjects", protect, getSectionSubjects);

export default router;
