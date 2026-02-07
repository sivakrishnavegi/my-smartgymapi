import { Request, Response } from 'express';
import { LeaveRequest as LeaveRequestModel } from '@academics/models/leaveRequest.schema';
import { logError } from '@shared/utils/errorLogger';
import mongoose from 'mongoose';

/**
 * Apply for leave (Student/Parent)
 */
export const applyLeave = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId, classId, sectionId, studentId, startDate, endDate, leaveType, reason } = req.body;
        const userId = (req as any).user?.id;
        const role = (req as any).user?.role;

        // Basic validation
        if (!tenantId || !schoolId || !classId || !sectionId || !studentId || !startDate || !endDate || !leaveType || !reason) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const leaveRequest = await LeaveRequestModel.create({
            tenantId,
            schoolId: new mongoose.Types.ObjectId(schoolId),
            classId: new mongoose.Types.ObjectId(classId),
            sectionId: new mongoose.Types.ObjectId(sectionId),
            studentId: new mongoose.Types.ObjectId(studentId),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            leaveType,
            reason,
            appliedBy: new mongoose.Types.ObjectId(userId),
            role: role || 'unknown',
        });

        return res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully.',
            data: leaveRequest,
        });
    } catch (error: any) {
        console.error('[APPLY LEAVE ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * Get leave requests (Teacher/Admin)
 */
export const getLeaveRequests = async (req: Request, res: Response) => {
    console.log('[DEBUG] getLeaveRequests hit', req.query);
    try {
        const {
            tenantId,
            schoolId,
            classId,
            sectionId,
            status,
            studentId,
            date,
            page = '1',
            limit = '10'
        } = (req.query as any).params || req.query;

        if (date) {
            console.log('[DEBUG] Filtering by date:', date);
        }

        if (!tenantId || !schoolId) {
            return res.status(400).json({ success: false, message: 'tenantId and schoolId are required.' });
        }

        const query: any = {
            tenantId,
            schoolId: new mongoose.Types.ObjectId(schoolId as string),
        };

        if (classId) query.classId = new mongoose.Types.ObjectId(classId as string);
        if (sectionId) query.sectionId = new mongoose.Types.ObjectId(sectionId as string);
        if (studentId) query.studentId = new mongoose.Types.ObjectId(studentId as string);
        if (status) query.status = status;
        if (date) {
            const queryDate = new Date(date as string);
            // Check if the query date falls within the start and end dates of the leave request
            // We want: startDate <= queryDate AND endDate >= queryDate
            // Since we store dates, let's ensure we compare correctly (ignoring time if needed, but for now strict date)
            // Or better: Leave covers this day.
            query.startDate = { $lte: queryDate };
            query.endDate = { $gte: queryDate };
        }

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const [requests, totalRecords] = await Promise.all([
            LeaveRequestModel.find(query)
                .populate('studentId', 'firstName lastName rollNo')
                .populate('appliedBy', 'profile.firstName profile.lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            LeaveRequestModel.countDocuments(query),
        ]);

        const totalPages = Math.ceil(totalRecords / limitNum);

        return res.status(200).json({
            success: true,
            data: requests,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: pageNum,
                limit: limitNum,
            },
        });
    } catch (error: any) {
        console.error('[GET LEAVE REQUESTS ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * Resolve (Approve/Reject) leave request
 */
export const resolveLeaveRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const adminId = (req as any).user?.id;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Use Approved or Rejected.' });
        }

        const leaveRequest = await LeaveRequestModel.findById(id);
        if (!leaveRequest) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        if (leaveRequest.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Leave request has already been resolved.' });
        }

        leaveRequest.status = status;
        leaveRequest.reviewedBy = new mongoose.Types.ObjectId(adminId);
        leaveRequest.reviewedAt = new Date();
        leaveRequest.remarks = remarks;

        await leaveRequest.save();

        return res.status(200).json({
            success: true,
            message: `Leave request ${status.toLowerCase()} successfully.`,
            data: leaveRequest,
        });
    } catch (error: any) {
        console.error('[RESOLVE LEAVE REQUEST ERROR]', error);
        await logError(req, error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
