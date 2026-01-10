"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBulkAttendance = exports.getSectionAttendance = exports.markBulkAttendance = exports.getStudentAttendance = exports.checkIn = void 0;
const attendence_user_1 = __importDefault(require("../models/attendence.user"));
const attendence_schema_1 = require("../models/student/attendence.schema");
const errorLogger_1 = require("../utils/errorLogger");
const mongoose_1 = __importDefault(require("mongoose"));
const checkIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const existingCheckIn = yield attendence_user_1.default.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
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
            }
            else {
                return res.status(409).json({
                    success: false,
                    message: 'Already checked in today.',
                    data: existingCheckIn,
                });
            }
        }
        const attendance = yield attendence_user_1.default.create({
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
    }
    catch (error) {
        console.error('[CHECK-IN ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});
exports.checkIn = checkIn;
/**
 * Get specific student attendance based on duration or month
 * Expandable academic year class id tenant id school id
 */
const getStudentAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { studentId } = req.params;
        const { tenantId, schoolId, classId, month, year, startDate, endDate, date, session, status, expand, page = '1', limit = '10', } = req.query;
        // 1. Basic Validation
        const errors = [];
        if (!studentId)
            errors.push('studentId is required.');
        if (!tenantId)
            errors.push('tenantId is required.');
        if (!schoolId)
            errors.push('schoolId is required.');
        if (!classId)
            errors.push('classId is required.');
        if (errors.length > 0) {
            console.error('[GET STUDENT ATTENDANCE VALIDATION ERROR]', errors);
            const errorMsg = 'Validation Error: ' + errors.join(', ');
            yield (0, errorLogger_1.logError)(req, { message: errorMsg });
            return res.status(400).json({
                success: false,
                message: errors.join(' '),
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
            const msg = `Invalid studentId format: ${studentId}`;
            console.error(`[GET STUDENT ATTENDANCE INVALID ID] ${msg}`);
            yield (0, errorLogger_1.logError)(req, { message: msg });
            return res.status(400).json({ success: false, message: 'Invalid studentId format.' });
        }
        // ... similar for other IDs if needed, but keeping it concise for now or adding them all
        if (!mongoose_1.default.Types.ObjectId.isValid(schoolId)) {
            console.error(`[GET STUDENT ATTENDANCE INVALID ID]schoolId: ${schoolId} `);
            return res.status(400).json({ success: false, message: 'Invalid schoolId format.' });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(classId)) {
            console.error(`[GET STUDENT ATTENDANCE INVALID ID]classId: ${classId} `);
            return res.status(400).json({ success: false, message: 'Invalid classId format.' });
        }
        // 2. Build Query
        const query = {
            studentId: new mongoose_1.default.Types.ObjectId(studentId),
            tenantId: tenantId,
            schoolId: new mongoose_1.default.Types.ObjectId(schoolId),
            classId: new mongoose_1.default.Types.ObjectId(classId),
        };
        if (session) {
            query.session = session;
        }
        if (status) {
            query.status = status;
        }
        // 3. Date Filtering logic
        if (date) {
            const attendanceDate = new Date(date);
            if (isNaN(attendanceDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid date format.' });
            }
            query.date = attendanceDate;
        }
        else if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        else if (month && year) {
            const monthInt = parseInt(month, 10);
            const yearInt = parseInt(year, 10);
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
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // 5. Expansion Logic
        let attendanceQuery = attendence_schema_1.Attendance.find(query).sort({ date: 1 });
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
        const [attendanceRecords, totalRecords] = yield Promise.all([
            attendanceQuery.skip(skip).limit(limitNum).lean(),
            attendence_schema_1.Attendance.countDocuments(query),
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
    }
    catch (error) {
        console.error('[GET STUDENT ATTENDANCE ERROR]', error);
        yield (0, errorLogger_1.logError)(req, error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});
exports.getStudentAttendance = getStudentAttendance;
/**
 * Mark attendance for all students in a specific section
 * Supports bulk upsert based on studentId and date
 */
const markBulkAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { tenantId, schoolId, classId, sectionId, date, session, attendanceData, // Array of { studentId, status, remarks }
         } = req.body;
        const markedById = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const markedByRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
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
        const bulkOps = attendanceData.map((record) => {
            const { studentId, status, remarks } = record;
            if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
                throw new Error(`Invalid studentId: ${studentId} `);
            }
            return {
                updateOne: {
                    filter: {
                        studentId: new mongoose_1.default.Types.ObjectId(studentId),
                        date: attendanceDate,
                    },
                    update: {
                        $set: {
                            tenantId,
                            schoolId: new mongoose_1.default.Types.ObjectId(schoolId),
                            classId: new mongoose_1.default.Types.ObjectId(classId),
                            sectionId: new mongoose_1.default.Types.ObjectId(sectionId),
                            status,
                            remarks: remarks || '',
                            markedBy: (markedById && mongoose_1.default.Types.ObjectId.isValid(markedById)) ? {
                                user: new mongoose_1.default.Types.ObjectId(markedById),
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
        yield attendence_schema_1.Attendance.bulkWrite(bulkOps);
        return res.status(200).json({
            success: true,
            message: `Attendance marked successfully for ${attendanceData.length} students.`,
        });
    }
    catch (error) {
        console.error('[MARK BULK ATTENDANCE ERROR]', error);
        yield (0, errorLogger_1.logError)(req, error);
        return res.status(error.message.startsWith('Invalid studentId') ? 400 : 500).json({
            success: false,
            message: error.message || 'Internal Server Error',
        });
    }
});
exports.markBulkAttendance = markBulkAttendance;
/**
 * Get attendance data for a specific section with pagination
 */
const getSectionAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sectionId } = req.params;
        const { tenantId, schoolId, classId, date, session, status, page = '1', limit = '10', } = req.query;
        // 1. Validation
        if (!sectionId || !tenantId || !schoolId || !classId || !date) {
            return res.status(400).json({
                success: false,
                message: 'sectionId, tenantId, schoolId, classId, and date are required.',
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(sectionId) ||
            !mongoose_1.default.Types.ObjectId.isValid(schoolId) ||
            !mongoose_1.default.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format.',
            });
        }
        const attendanceDate = new Date(date);
        if (isNaN(attendanceDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format.',
            });
        }
        // 2. Build Query
        const query = {
            sectionId: new mongoose_1.default.Types.ObjectId(sectionId),
            tenantId: tenantId,
            schoolId: new mongoose_1.default.Types.ObjectId(schoolId),
            classId: new mongoose_1.default.Types.ObjectId(classId),
            date: attendanceDate,
        };
        if (session) {
            query.session = session;
        }
        if (status) {
            query.status = status;
        }
        // 3. Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // 4. Fetch Data
        const [attendanceRecords, totalRecords] = yield Promise.all([
            attendence_schema_1.Attendance.find(query)
                .populate('studentId', 'firstName lastName admissionNo rollNo')
                .sort({ 'studentId.rollNo': 1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            attendence_schema_1.Attendance.countDocuments(query),
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
    }
    catch (error) {
        console.error('[GET SECTION ATTENDANCE ERROR]', error);
        yield (0, errorLogger_1.logError)(req, error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});
exports.getSectionAttendance = getSectionAttendance;
/**
 * Update attendance for all students in a specific section
 * Supports bulk upsert and logs updatedBy details
 */
const updateBulkAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { tenantId, schoolId, classId, sectionId, date, session, attendanceData, // Array of { studentId, status, remarks }
         } = req.body;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const currentUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
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
        const bulkOps = attendanceData.map((record) => {
            const { studentId, status, remarks } = record;
            if (!mongoose_1.default.Types.ObjectId.isValid(studentId)) {
                throw new Error(`Invalid studentId: ${studentId} `);
            }
            const logInfo = (currentUserId && mongoose_1.default.Types.ObjectId.isValid(currentUserId)) ? {
                user: new mongoose_1.default.Types.ObjectId(currentUserId),
                role: currentUserRole || 'unknown',
                at: new Date()
            } : undefined;
            return {
                updateOne: {
                    filter: {
                        studentId: new mongoose_1.default.Types.ObjectId(studentId),
                        date: attendanceDate,
                    },
                    update: {
                        $set: {
                            tenantId,
                            schoolId: new mongoose_1.default.Types.ObjectId(schoolId),
                            classId: new mongoose_1.default.Types.ObjectId(classId),
                            sectionId: new mongoose_1.default.Types.ObjectId(sectionId),
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
        yield attendence_schema_1.Attendance.bulkWrite(bulkOps);
        return res.status(200).json({
            success: true,
            message: `Bulk attendance updated successfully for ${attendanceData.length} students.`,
        });
    }
    catch (error) {
        console.error('[UPDATE BULK ATTENDANCE ERROR]', error);
        yield (0, errorLogger_1.logError)(req, error);
        return res.status(error.message.startsWith('Invalid studentId') ? 400 : 500).json({
            success: false,
            message: error.message || 'Internal Server Error',
        });
    }
});
exports.updateBulkAttendance = updateBulkAttendance;
