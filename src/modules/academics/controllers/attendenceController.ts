import { Request, Response } from 'express';
import AttendanceModel from '@academics/models/attendence.user';
import { Attendance as StudentAttendanceModel } from '@academics/models/attendence.schema';
import { Student as StudentModel } from '@academics/models/student.schema';
import { AttendanceCorrection as AttendanceCorrectionModel } from '@academics/models/attendanceCorrection.schema';
import { logError } from '@shared/utils/errorLogger';
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
              isMarked: true,
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
              isMarked: true,
            },
            $push: {
              editHistory: {
                updatedStatus: status,
                changedBy: logInfo?.user,
                changedAt: logInfo?.at || new Date(),
                remarks: remarks || '',
              },
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

/**
 * Get attendance record of the day for all students in a specific class/section
 */
export const getDailyAttendanceRecord = async (req: Request, res: Response) => {
  try {
    const { tenantId, schoolId, classId, sectionId, date, page = '1', limit = '10' } = (req.query as any).params || req.query;

    // 1. Validation
    if (!tenantId || !schoolId || !classId || !sectionId || !date) {
      return res.status(400).json({
        success: false,
        message: 'tenantId, schoolId, classId, sectionId, and date are required.',
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(schoolId as string) ||
      !mongoose.Types.ObjectId.isValid(classId as string) ||
      !mongoose.Types.ObjectId.isValid(sectionId as string)
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

    // Pagination constants
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const studentFilter = {
      tenantId,
      schoolId: new mongoose.Types.ObjectId(schoolId as string),
      classId: new mongoose.Types.ObjectId(classId as string),
      sectionId: new mongoose.Types.ObjectId(sectionId as string),
      status: 'Active',
    };

    // 2. Fetch students with pagination and total count
    const [students, totalStudents] = await Promise.all([
      StudentModel.find(studentFilter)
        .select('firstName lastName admissionNo rollNo')
        .sort({ rollNo: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StudentModel.countDocuments(studentFilter),
    ]);

    // 3. Fetch attendance records for ONLY these students on this date
    const studentIds = students.map(s => s._id);
    const attendanceRecords = await StudentAttendanceModel.find({
      tenantId,
      studentId: { $in: studentIds },
      date: attendanceDate,
    }).lean();

    const attendanceMap = new Map(attendanceRecords.map((r) => [r.studentId.toString(), r]));

    // 4. Merge data
    const result = students.map((student) => {
      const attendance = attendanceMap.get(student._id.toString());
      return {
        ...student,
        attendance: attendance || null,
        isMarked: !!attendance,
      };
    });

    const totalPages = Math.ceil(totalStudents / limitNum);

    return res.status(200).json({
      success: true,
      message: 'Daily attendance records fetched successfully.',
      data: result,
      pagination: {
        totalRecords: totalStudents,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
      summary: {
        totalStudents,
        markedCount: attendanceRecords.length,
        unmarkedCount: students.length - attendanceRecords.length,
      },
    });
  } catch (error: any) {
    console.error('[GET DAILY ATTENDANCE RECORD ERROR]', error);
    await logError(req, error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

/**
 * Submit a request for attendance correction (For Students/Parents)
 */
export const submitCorrectionRequest = async (req: Request, res: Response) => {
  try {
    const { attendanceId, requestedStatus, reason } = req.body;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!attendanceId || !requestedStatus || !reason) {
      return res.status(400).json({ success: false, message: 'attendanceId, requestedStatus, and reason are required.' });
    }

    const attendance = await StudentAttendanceModel.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    const correctionRequest = await AttendanceCorrectionModel.create({
      tenantId: attendance.tenantId,
      schoolId: attendance.schoolId,
      classId: attendance.classId,
      sectionId: attendance.sectionId,
      studentId: attendance.studentId,
      attendanceId,
      currentStatus: attendance.status,
      requestedStatus,
      reason,
      requestedBy: userId,
      role: role || 'unknown',
    });

    return res.status(201).json({
      success: true,
      message: 'Correction request submitted successfully.',
      data: correctionRequest,
    });
  } catch (error: any) {
    console.error('[SUBMIT CORRECTION REQUEST ERROR]', error);
    await logError(req, error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * Get pending correction requests for approval (For Teachers/Admins)
 */
export const getCorrectionRequests = async (req: Request, res: Response) => {
  try {
    const { tenantId, schoolId, classId, sectionId, status = 'Pending' } = req.query;

    if (!tenantId || !schoolId) {
      return res.status(400).json({ success: false, message: 'tenantId and schoolId are required.' });
    }

    const query: any = {
      tenantId,
      schoolId: new mongoose.Types.ObjectId(schoolId as string),
      status,
    };

    if (classId) query.classId = new mongoose.Types.ObjectId(classId as string);
    if (sectionId) query.sectionId = new mongoose.Types.ObjectId(sectionId as string);

    const requests = await AttendanceCorrectionModel.find(query)
      .populate('studentId', 'firstName lastName rollNo')
      .populate('requestedBy', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error('[GET CORRECTION REQUESTS ERROR]', error);
    await logError(req, error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * Resolve (Approve/Reject) a correction request
 */
export const resolveCorrectionRequest = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { requestId } = req.params;
    const { status, adminRemarks } = req.body;
    const adminId = (req as any).user?.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved or Rejected.' });
    }

    const request = await AttendanceCorrectionModel.findById(requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'Pending') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Request has already been resolved.' });
    }

    request.status = status;
    request.reviewedBy = adminId as any;
    request.reviewedAt = new Date();
    request.adminRemarks = adminRemarks;
    await request.save({ session });

    if (status === 'Approved') {
      // Synchronize with main attendance record
      const attendance = await StudentAttendanceModel.findById(request.attendanceId).session(session);
      if (attendance) {
        const previousStatus = attendance.status;
        attendance.status = request.requestedStatus as any;

        // Push to edit history
        attendance.editHistory.push({
          previousStatus,
          updatedStatus: request.requestedStatus,
          changedBy: adminId as any,
          changedAt: new Date(),
          remarks: `Approved correction request: ${request.reason}`,
        });

        attendance.updatedBy = {
          user: adminId as any,
          role: (req as any).user?.role || 'Admin',
          at: new Date(),
        };

        await attendance.save({ session });
      }
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: `Correction request ${status.toLowerCase()} successfully.`,
      data: request,
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('[RESOLVE CORRECTION REQUEST ERROR]', error);
    await logError(req, error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    session.endSession();
  }
};


