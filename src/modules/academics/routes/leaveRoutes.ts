import express from 'express';
import { applyLeave, getLeaveRequests, resolveLeaveRequest } from '@academics/controllers/leaveController';
import { protect } from '@shared/middlewares/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/leave/apply:
 *   post:
 *     summary: Apply for leave (Student/Parent)
 *     tags: [Leave]
 */
router.post('/apply', protect, applyLeave);

/**
 * @swagger
 * /api/leave/requests:
 *   get:
 *     summary: Get leave requests (Teacher/Admin)
 *     tags: [Leave]
 */
router.get('/requests', protect, getLeaveRequests);

/**
 * @swagger
 * /api/leave/requests/{id}:
 *   patch:
 *     summary: Resolve (Approve/Reject) leave request
 *     tags: [Leave]
 */
router.patch('/requests/:id', protect, resolveLeaveRequest);

export default router;
