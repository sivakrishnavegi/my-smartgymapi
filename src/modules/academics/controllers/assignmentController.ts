import { Request, Response } from 'express';
import { Assignment } from '@academics/models/assignment.schema';
import { logError } from '@shared/utils/errorLogger';
import mongoose from 'mongoose';

export const createAssignment = async (req: Request, res: Response) => {
    try {
        const {
            tenantId,
            schoolId,
            classId,
            sectionId,
            subjectId,
            title,
            description,
            dueDate,
            maxMarks,
            attachments,
            status,
            submissionType
        } = req.body;

        const teacherId = (req as any).user?.id;

        if (!tenantId || !schoolId || !classId || !sectionId || !title || !dueDate || !maxMarks) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        const assignment = await Assignment.create({
            tenantId,
            schoolId: new mongoose.Types.ObjectId(schoolId as string),
            classId: new mongoose.Types.ObjectId(classId as string),
            sectionId: new mongoose.Types.ObjectId(sectionId as string),
            subjectId: subjectId ? new mongoose.Types.ObjectId(subjectId as string) : undefined,
            teacherId: new mongoose.Types.ObjectId(teacherId as string),
            title,
            description,
            dueDate: new Date(dueDate),
            maxMarks,
            attachments: attachments || [],
            status: status || 'Draft',
            submissionType: submissionType || 'File'
        });

        return res.status(201).json({ success: true, message: 'Assignment created successfully.', data: assignment });
    } catch (error: any) {
        console.error('[CREATE ASSIGNMENT ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getAssignments = async (req: Request, res: Response) => {
    try {
        const {
            tenantId,
            schoolId,
            classId,
            sectionId,
            subjectId,
            teacherId,
            status,
            page = '1',
            limit = '10'
        } = (req.query as any).params || req.query;

        if (!tenantId || !schoolId) {
            return res.status(400).json({ success: false, message: 'tenantId and schoolId are required.' });
        }

        const query: any = {
            tenantId,
            schoolId: new mongoose.Types.ObjectId(schoolId as string),
        };

        if (classId) query.classId = new mongoose.Types.ObjectId(classId as string);
        if (sectionId) query.sectionId = new mongoose.Types.ObjectId(sectionId as string);
        if (subjectId) query.subjectId = new mongoose.Types.ObjectId(subjectId as string);
        if (teacherId) query.teacherId = new mongoose.Types.ObjectId(teacherId as string);
        if (status) query.status = status;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const [assignments, totalRecords] = await Promise.all([
            Assignment.find(query)
                .populate('classId', 'className classCode')
                .populate('sectionId', 'sectionName sectionCode')
                .populate('subjectId', 'name code')
                .populate('teacherId', 'staffId') // Assuming 'staffId' exists in TeacherProfile model, or populate user
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Assignment.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalRecords / limitNum);

        return res.status(200).json({
            success: true,
            data: assignments,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: pageNum,
                limit: limitNum
            }
        });
    } catch (error: any) {
        console.error('[GET ASSIGNMENTS ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const getAssignmentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findById(id)
            .populate('classId', 'className classCode')
            .populate('sectionId', 'sectionName sectionCode')
            .populate('subjectId', 'name code')
            .lean();

        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }

        return res.status(200).json({ success: true, data: assignment });
    } catch (error: any) {
        console.error('[GET ASSIGNMENT BY ID ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateAssignment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const teacherId = (req as any).user?.id;

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }

        // Optional: Check if the user is the creator
        if (assignment.teacherId.toString() !== teacherId) {
            // Depending on business logic, maybe allow admins too
            // keeping it simple for now
        }

        const updatedAssignment = await Assignment.findByIdAndUpdate(id, updateData, { new: true }).lean();

        return res.status(200).json({ success: true, message: 'Assignment updated successfully.', data: updatedAssignment });
    } catch (error: any) {
        console.error('[UPDATE ASSIGNMENT ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const deleteAssignment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findByIdAndDelete(id);

        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }

        return res.status(200).json({ success: true, message: 'Assignment deleted successfully.' });
    } catch (error: any) {
        console.error('[DELETE ASSIGNMENT ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
