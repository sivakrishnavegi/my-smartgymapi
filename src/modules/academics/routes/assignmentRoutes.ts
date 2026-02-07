import express from 'express';
import {
    createAssignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment
} from '@academics/controllers/assignmentController';
import {
    submitAssignment,
    getSubmissions,
    getMySubmissions,
    gradeSubmission
} from '@academics/controllers/submissionController';
import { protect } from '@shared/middlewares/authMiddleware';

const router = express.Router();

// --- Submission Routes ---

/**
 * @swagger
 * /api/academics/assignments/submissions/me:
 *   get:
 *     summary: Get my submissions (Student)
 *     tags: [Assignments]
 */
router.get('/submissions/me', protect, getMySubmissions);

/**
 * @swagger
 * /api/academics/assignments/submissions/{submissionId}/grade:
 *   patch:
 *     summary: Grade a submission (Teacher/Admin)
 *     tags: [Assignments]
 */
router.patch('/submissions/:submissionId/grade', protect, gradeSubmission);

/**
 * @swagger
 * /api/academics/assignments/{assignmentId}/submit:
 *   post:
 *     summary: Submit an assignment (Student)
 *     tags: [Assignments]
 */
router.post('/:assignmentId/submit', protect, submitAssignment);

/**
 * @swagger
 * /api/academics/assignments/{assignmentId}/submissions:
 *   get:
 *     summary: Get submissions for an assignment (Teacher/Admin)
 *     tags: [Assignments]
 */
router.get('/:assignmentId/submissions', protect, getSubmissions);

// --- Assignment Routes ---

/**
 * @swagger
 * /api/academics/assignments:
 *   post:
 *     summary: Create an assignment (Teacher/Admin)
 *     tags: [Assignments]
 *   get:
 *     summary: Get all assignments (Teacher/Admin/Student)
 *     tags: [Assignments]
 */
router.route('/')
    .post(protect, createAssignment)
    .get(protect, getAssignments);

/**
 * @swagger
 * /api/academics/assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Assignments]
 *   patch:
 *     summary: Update assignment
 *     tags: [Assignments]
 *   delete:
 *     summary: Delete assignment
 *     tags: [Assignments]
 */
router.route('/:id')
    .get(protect, getAssignmentById)
    .patch(protect, updateAssignment)
    .delete(protect, deleteAssignment);

export default router;
