import { Request, Response } from 'express';
import { Submission } from '@academics/models/submission.schema';
import { Assignment } from '@academics/models/assignment.schema';
import { logError } from '@shared/utils/errorLogger';
import mongoose from 'mongoose';

/**
 * Student submits an assignment
 */
export const submitAssignment = async (req: Request, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const {
            tenantId,
            schoolId,
            classId,
            sectionId,
            submissionFile,
            submissionText
        } = req.body;

        const studentId = (req as any).user?.id; // Assuming student ID is in token

        if (!assignmentId || !tenantId || !schoolId || !classId || !sectionId) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        if (!submissionFile && !submissionText) {
            return res.status(400).json({ success: false, message: 'Submission must contain a file or text.' });
        }

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }

        // Check if already submitted
        const existingSubmission = await Submission.findOne({
            assignmentId: new mongoose.Types.ObjectId(assignmentId),
            studentId: new mongoose.Types.ObjectId(studentId)
        });

        if (existingSubmission) {
            // Update existing submission
            existingSubmission.submissionFile = submissionFile || existingSubmission.submissionFile;
            existingSubmission.submissionText = submissionText || existingSubmission.submissionText;
            existingSubmission.submittedAt = new Date();
            existingSubmission.status = 'Submitted';
            // Logic to check if late could be added here
            if (new Date() > assignment.dueDate) {
                existingSubmission.status = 'Late';
            }
            await existingSubmission.save();
            return res.status(200).json({ success: true, message: 'Assignment resubmitted successfully.', data: existingSubmission });
        }

        let initialStatus = 'Submitted';
        if (new Date() > assignment.dueDate) {
            initialStatus = 'Late';
        }

        const submission = await Submission.create({
            assignmentId: new mongoose.Types.ObjectId(assignmentId),
            studentId: new mongoose.Types.ObjectId(studentId),
            tenantId,
            schoolId: new mongoose.Types.ObjectId(schoolId as string),
            classId: new mongoose.Types.ObjectId(classId as string),
            sectionId: new mongoose.Types.ObjectId(sectionId as string),
            submissionFile: submissionFile || [],
            submissionText,
            status: initialStatus,
            submittedAt: new Date()
        });

        return res.status(201).json({ success: true, message: 'Assignment submitted successfully.', data: submission });
    } catch (error: any) {
        console.error('[SUBMIT ASSIGNMENT ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * Teacher views submissions for an assignment
 */
export const getSubmissions = async (req: Request, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const {
            tenantId,
            schoolId,
            status,
            page = '1',
            limit = '10'
        } = (req.query as any).params || req.query;

        if (!assignmentId || !tenantId || !schoolId) {
            return res.status(400).json({ success: false, message: 'assignmentId, tenantId and schoolId are required.' });
        }

        const query: any = {
            assignmentId: new mongoose.Types.ObjectId(assignmentId),
            tenantId,
            schoolId: new mongoose.Types.ObjectId(schoolId as string)
        };

        if (status) query.status = status;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const [submissions, totalRecords] = await Promise.all([
            Submission.find(query)
                .populate('studentId', 'firstName lastName admissionNo rollNo')
                .populate('gradedBy', 'staffId')
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Submission.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalRecords / limitNum);

        return res.status(200).json({
            success: true,
            data: submissions,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: pageNum,
                limit: limitNum
            }
        });
    } catch (error: any) {
        console.error('[GET SUBMISSIONS ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * Teacher grades a submission
 */
export const gradeSubmission = async (req: Request, res: Response) => {
    try {
        const { submissionId } = req.params;
        const { obtainedMarks, feedback, status } = req.body;
        const teacherId = (req as any).user?.id;

        if (obtainedMarks === undefined) {
            return res.status(400).json({ success: false, message: 'Marks are required.' });
        }

        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found.' });
        }

        submission.obtainedMarks = obtainedMarks;
        submission.feedback = feedback;
        submission.status = status || 'Graded';
        submission.gradedBy = new mongoose.Types.ObjectId(teacherId as string);
        submission.gradedAt = new Date();

        await submission.save();

        return res.status(200).json({ success: true, message: 'Submission graded successfully.', data: submission });
    } catch (error: any) {
        console.error('[GRADE SUBMISSION ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * Student views their own submissions
 */
export const getMySubmissions = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user?.id;
        const {
            tenantId,
            schoolId,
            status,
            page = '1',
            limit = '10'
        } = (req.query as any).params || req.query;

        if (!tenantId || !schoolId) {
            return res.status(400).json({ success: false, message: 'tenantId and schoolId are required.' });
        }

        const query: any = {
            studentId: new mongoose.Types.ObjectId(studentId),
            tenantId,
            schoolId: new mongoose.Types.ObjectId(schoolId as string)
        };

        if (status) query.status = status;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const [submissions, totalRecords] = await Promise.all([
            Submission.find(query)
                .populate('assignmentId', 'title dueDate maxMarks')
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Submission.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalRecords / limitNum);

        return res.status(200).json({
            success: true,
            data: submissions,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: pageNum,
                limit: limitNum
            }
        });

    } catch (error: any) {
        console.error('[GET MY SUBMISSIONS ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
