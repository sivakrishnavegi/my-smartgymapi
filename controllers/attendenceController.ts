import { Request, Response } from 'express';
import AttendanceModel from '../models/attendence.user';
import { Attendance as StudentAttendanceModel } from '../models/student/attendence.schema';
import { logError } from '../utils/errorLogger';
import mongoose from 'mongoose';

export const checkIn = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingCheckIn = await AttendanceModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (existingCheckIn) {
      if (existingCheckIn.status === 'pending') {
        return res.status(200).json({
          success: false,
          message: 'Already checked in today. Awaiting approval.',
          data: existingCheckIn,
          qrCodeData: `check -in:${existingCheckIn._id}:${userId} `,
        });
      } else {
        return res.status(409).json({
          success: false,
          message: 'Already checked in today.',
          data: existingCheckIn,
        });
      }
    }

    const attendance = await AttendanceModel.create({
      userId,
      date: new Date(),
      checkInTime: new Date(),
      status: 'pending', // initially pending, can be updated by staff
    });

    return res.status(201).json({
      success: true,
      message: 'Check-in recorded. Awaiting staff approval.',
      data: attendance,
      qrCodeData: `check -in:${attendance._id}:${userId} `,
    });
  } catch (error) {
    console.error('[CHECK-IN ERROR]', error);
    await logError(req, error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

/**
 * Get specific student attendance based on duration or month
 * Expandable academic year class id tenant id school id
 */
export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;


    // Handle nested params object if present (common in some frontend frameworks or proxy setups)
    let queryParams = (req.query as any).params || req.query;

    // Fallback: Manually parse keys like "params[tenantId]" if query parser didn't nest them
    if (!queryParams.tenantId && !queryParams.schoolId) {
      const manualParams: any = {};
      Object.keys(req.query).forEach((key) => {
        const match = key.match(/^params\[(\w+)\]$/);
        if (match) {
          manualParams[match[1]] = req.query[key];
        } else {
          manualParams[key] = req.query[key];
        }
      });
      if (Object.keys(manualParams).length > 0) {
        queryParams = { ...queryParams, ...manualParams };
      }
    }

    const {
      tenantId,
      schoolId,
      classId,
      month,
      year,
      startDate,
      endDate,
      date,
      session,
      status,
      expand,
    } = queryParams;

    // Handle pagination from top-level or nested
    const page = queryParams.page || req.query.page || '1';
    const limitParams = queryParams.limit || req.query.limit || '10';

    // 1. Basic Validation
    const errors: string[] = [];
    if (!studentId) errors.push('studentId is required.');
    if (!tenantId) errors.push('tenantId is required.');
    if (!schoolId) errors.push('schoolId is required.');
    if (!classId) errors.push('classId is required.');

    if (errors.length > 0) {
      console.error('[GET STUDENT ATTENDANCE VALIDATION ERROR]', errors);
      const errorMsg = 'Validation Error: ' + errors.join(', ');
      await logError(req, { message: errorMsg });
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      const msg = `Invalid studentId format: ${studentId}`;
      console.error(`[GET STUDENT ATTENDANCE INVALID ID] ${msg}`);
      await logError(req, { message: msg });
      return res.status(400).json({ success: false, message: 'Invalid studentId format.' });
    }
    // ... similar for other IDs if needed, but keeping it concise for now or adding them all
    if (!mongoose.Types.ObjectId.isValid(schoolId as string)) {
      console.error(`[GET STUDENT ATTENDANCE INVALID ID]schoolId: ${schoolId} `);
      return res.status(400).json({ success: false, message: 'Invalid schoolId format.' });
    }
    if (!mongoose.Types.ObjectId.isValid(classId as string)) {
      console.error(`[GET STUDENT ATTENDANCE INVALID ID]classId: ${classId} `);
      return res.status(400).json({ success: false, message: 'Invalid classId format.' });
    }

    // 2. Build Query
    const query: any = {
      studentId: new mongoose.Types.ObjectId(studentId),
      tenantId: tenantId,
      schoolId: new mongoose.Types.ObjectId(schoolId as string),
      classId: new mongoose.Types.ObjectId(classId as string),
    };

    if (session) {
      query.session = session;
    }

    if (status) {
      query.status = status;
    }

    // 3. Date Filtering logic
    if (date) {
      const attendanceDate = new Date(date as string);
      if (isNaN(attendanceDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format.' });
      }
      query.date = attendanceDate;
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    } else if (month && year) {
      const monthInt = parseInt(month as string, 10);
      const yearInt = parseInt(year as string, 10);

      if (!isNaN(monthInt) && !isNaN(yearInt)) {
        const startOfMonth = new Date(yearInt, monthInt - 1, 1);
        const endOfMonth = new Date(yearInt, monthInt, 0, 23, 59, 59, 999);
        query.date = {
          $gte: startOfMonth,
          $lte: endOfMonth,
        };
      }
    }

    // 4. Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limitParams as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // 5. Expansion Logic
    let attendanceQuery = StudentAttendanceModel.find(query).sort({ date: 1 });

    if (expand && typeof expand === 'string') {
      const expandFields = expand.split(',');
      if (expandFields.includes('studentId')) {
        attendanceQuery = attendanceQuery.populate('studentId', 'firstName lastName admissionNo rollNo');
      }
      if (expandFields.includes('classId')) {
        attendanceQuery = attendanceQuery.populate('classId', 'className classCode');
      }
      if (expandFields.includes('sectionId')) {
        attendanceQuery = attendanceQuery.populate('sectionId', 'sectionName sectionCode');
      }
      if (expandFields.includes('schoolId')) {
        attendanceQuery = attendanceQuery.populate('schoolId', 'name code address');
      }
      if (expandFields.includes('markedBy')) {
        attendanceQuery = attendanceQuery.populate('markedBy.user', 'profile.firstName profile.lastName account.primaryEmail');
      }
    }

    // 6. Fetch Data
    const [attendanceRecords, totalRecords] = await Promise.all([
      attendanceQuery.skip(skip).limit(limitNum).lean(),
      StudentAttendanceModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRecords / limitNum);

    return res.status(200).json({
      success: true,
      message: 'Student attendance records fetched successfully.',
      data: attendanceRecords,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
      count: attendanceRecords.length, // Keeping count for backward compatibility if needed
    });
  } catch (error: any) {
    console.error('[GET STUDENT ATTENDANCE ERROR]', error);
    await logError(req, error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

/**
 * Mark attendance for all students in a specific section
 * Supports bulk upsert based on studentId and date
 */
export const markBulkAttendance = async (req: Request, res: Response) => {
  try {
    const {
      tenantId,
      schoolId,
      classId,
      sectionId,
      date,
      session,
      attendanceData, // Array of { studentId, status, remarks }
    } = req.body;

    const markedById = (req as any).user?.id;
    const markedByRole = (req as any).user?.role;

    // 1. Validation
    if (!tenantId || !schoolId || !classId || !sectionId || !date || !attendanceData) {
      return res.status(400).json({
        success: false,
        message: 'tenantId, schoolId, classId, sectionId, date, and attendanceData are required.',
      });
    }

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'attendanceData must be a non-empty array.',
      });
    }

    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format.',
      });
    }

    // 2. Prepare Bulk Operations
    const bulkOps = attendanceData.map((record: any) => {
      const { studentId, status, remarks } = record;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        throw new Error(`Invalid studentId: ${studentId} `);
      }

      return {
        updateOne: {
          filter: {
            studentId: new mongoose.Types.ObjectId(studentId),
            date: attendanceDate,
          },
          update: {
            $set: {
              tenantId,
              schoolId: new mongoose.Types.ObjectId(schoolId as string),
              classId: new mongoose.Types.ObjectId(classId as string),
              sectionId: new mongoose.Types.ObjectId(sectionId as string),
              status,
              remarks: remarks || '',
              markedBy: (markedById && mongoose.Types.ObjectId.isValid(markedById)) ? {
                user: new mongoose.Types.ObjectId(markedById as string),
                role: markedByRole || 'unknown',
                at: new Date()
              } : undefined,
              session, // e.g. "2025-26"
            },
          },
          upsert: true,
        },
      };
    });

    // 3. Execute Bulk Write
    await StudentAttendanceModel.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      message: `Attendance marked successfully for ${attendanceData.length} students.`,
    });
  } catch (error: any) {
    console.error('[MARK BULK ATTENDANCE ERROR]', error);
    await logError(req, error);
    return res.status(error.message.startsWith('Invalid studentId') ? 400 : 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

/**
 * Get attendance data for a specific section with pagination
 */
export const getSectionAttendance = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const {
      tenantId,
      schoolId,
      classId,
      date,
      session,
      status,
      page = '1',
      limit = '10',
    } = req.query;

    // 1. Validation
    if (!sectionId || !tenantId || !schoolId || !classId || !date) {
      return res.status(400).json({
        success: false,
        message: 'sectionId, tenantId, schoolId, classId, and date are required.',
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(sectionId) ||
      !mongoose.Types.ObjectId.isValid(schoolId as string) ||
      !mongoose.Types.ObjectId.isValid(classId as string)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format.',
      });
    }

    const attendanceDate = new Date(date as string);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format.',
      });
    }

    // 2. Build Query
    const query: any = {
      sectionId: new mongoose.Types.ObjectId(sectionId),
      tenantId: tenantId,
      schoolId: new mongoose.Types.ObjectId(schoolId as string),
      classId: new mongoose.Types.ObjectId(classId as string),
      date: attendanceDate,
    };

    if (session) {
      query.session = session;
    }

    if (status) {
      query.status = status;
    }

    // 3. Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // 4. Fetch Data
    const [attendanceRecords, totalRecords] = await Promise.all([
      StudentAttendanceModel.find(query)
        .populate('studentId', 'firstName lastName admissionNo rollNo')
        .sort({ 'studentId.rollNo': 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StudentAttendanceModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRecords / limitNum);

    return res.status(200).json({
      success: true,
      message: 'Section attendance records fetched successfully.',
      data: attendanceRecords,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error: any) {
    console.error('[GET SECTION ATTENDANCE ERROR]', error);
    await logError(req, error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

/**
 * Update attendance for all students in a specific section
 * Supports bulk upsert and logs updatedBy details
 */
export const updateBulkAttendance = async (req: Request, res: Response) => {
  try {
    const {
      tenantId,
      schoolId,
      classId,
      sectionId,
      date,
      session,
      attendanceData, // Array of { studentId, status, remarks }
    } = req.body;

    const currentUserId = (req as any).user?.id;
    const currentUserRole = (req as any).user?.role;

    // 1. Validation
    if (!tenantId || !schoolId || !classId || !sectionId || !date || !attendanceData) {
      return res.status(400).json({
        success: false,
        message: 'tenantId, schoolId, classId, sectionId, date, and attendanceData are required.',
      });
    }

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'attendanceData must be a non-empty array.',
      });
    }

    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format.',
      });
    }

    // 2. Prepare Bulk Operations
    const bulkOps = attendanceData.map((record: any) => {
      const { studentId, status, remarks } = record;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        throw new Error(`Invalid studentId: ${studentId} `);
      }

      const logInfo = (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) ? {
        user: new mongoose.Types.ObjectId(currentUserId as string),
        role: currentUserRole || 'unknown',
        at: new Date()
      } : undefined;

      return {
        updateOne: {
          filter: {
            studentId: new mongoose.Types.ObjectId(studentId),
            date: attendanceDate,
          },
          update: {
            $set: {
              tenantId,
              schoolId: new mongoose.Types.ObjectId(schoolId as string),
              classId: new mongoose.Types.ObjectId(classId as string),
              sectionId: new mongoose.Types.ObjectId(sectionId as string),
              status,
              remarks: remarks || '',
              session,
              updatedBy: logInfo,
            },
            $setOnInsert: {
              markedBy: logInfo,
            }
          },
          upsert: true,
        },
      };
    });

    // 3. Execute Bulk Write
    await StudentAttendanceModel.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      message: `Bulk attendance updated successfully for ${attendanceData.length} students.`,
    });
  } catch (error: any) {
    console.error('[UPDATE BULK ATTENDANCE ERROR]', error);
    await logError(req, error);
    return res.status(error.message.startsWith('Invalid studentId') ? 400 : 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};
