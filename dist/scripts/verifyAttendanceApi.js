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
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const attendenceController_1 = require("../controllers/attendenceController");
const attendence_schema_1 = require("../models/student/attendence.schema");
require("../models/student/student.schema"); // Ensure Student model is registered
require("../models/section.model"); // Ensure Section model is registered
require("../models/class.model"); // Ensure Class model is registered
require("../models/schools.schema"); // Ensure School model is registered
require("../models/users.schema"); // Ensure User model is registered
require("../models/errorLog.schema"); // Ensure ErrorLog model is registered
dotenv_1.default.config();
const runVerification = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        console.log('--- Starting Verification ---');
        // 1. Connect to DB
        const mongoUri = process.env.MONGODB_SECRET_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_SECRET_URI not found in environment');
        }
        yield mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB');
        // 2. Seed Mock Data
        const mockStudentId = new mongoose_1.default.Types.ObjectId();
        const mockStudentId2 = new mongoose_1.default.Types.ObjectId();
        const mockSchoolId = new mongoose_1.default.Types.ObjectId();
        const mockClassId = new mongoose_1.default.Types.ObjectId();
        const mockSectionId = new mongoose_1.default.Types.ObjectId();
        const mockTenantId = '03254a3f-8c89-4a32-ae74-75e68f8062f1';
        // Cleanup before start
        yield attendence_schema_1.Attendance.deleteMany({ tenantId: mockTenantId });
        console.log('Previous mock records cleaned');
        const attendanceRecords = [
            {
                studentId: mockStudentId,
                schoolId: mockSchoolId,
                classId: mockClassId,
                sectionId: mockSectionId,
                tenantId: mockTenantId,
                date: new Date('2025-01-01'),
                status: 'Present',
                session: '2024-25',
                markedBy: { user: new mongoose_1.default.Types.ObjectId(), role: 'teacher', at: new Date() }
            },
            {
                studentId: mockStudentId,
                schoolId: mockSchoolId,
                classId: mockClassId,
                sectionId: mockSectionId,
                tenantId: mockTenantId,
                date: new Date('2025-01-02'),
                status: 'Absent',
                session: '2024-25',
                markedBy: { user: new mongoose_1.default.Types.ObjectId(), role: 'teacher', at: new Date() }
            },
            {
                studentId: mockStudentId,
                schoolId: mockSchoolId,
                classId: mockClassId,
                sectionId: mockSectionId,
                tenantId: mockTenantId,
                date: new Date('2025-02-01'),
                status: 'Present',
                session: '2024-25',
                markedBy: { user: new mongoose_1.default.Types.ObjectId(), role: 'teacher', at: new Date() }
            }
        ];
        yield attendence_schema_1.Attendance.insertMany(attendanceRecords);
        console.log('Mock attendance records seeded');
        let resData = null;
        let resStatus = 0;
        const mockRes = {
            status: (code) => {
                resStatus = code;
                return {
                    json: (data) => {
                        resData = data;
                    }
                };
            }
        };
        // 3. Test Month Filter
        const mockReqMonth = {
            params: { studentId: mockStudentId.toString() },
            query: {
                tenantId: mockTenantId.toString(),
                schoolId: mockSchoolId.toString(),
                classId: mockClassId.toString(),
                month: '1',
                year: '2025',
            }
        };
        console.log('Testing Month Filter (January 2025)...');
        yield (0, attendenceController_1.getStudentAttendance)(mockReqMonth, mockRes);
        if (resStatus === 200 && resData.success && resData.count === 2) {
            console.log('✅ Month filter verified: Found 2 records for January');
        }
        else {
            console.log('❌ Month filter failed:', { resStatus, count: resData === null || resData === void 0 ? void 0 : resData.count, message: resData === null || resData === void 0 ? void 0 : resData.message });
        }
        // 4. Test Duration Filter
        const mockReqDuration = {
            params: { studentId: mockStudentId.toString() },
            query: {
                tenantId: mockTenantId.toString(),
                schoolId: mockSchoolId.toString(),
                classId: mockClassId.toString(),
                startDate: '2025-01-02',
                endDate: '2025-02-01',
            }
        };
        console.log('Testing Duration Filter (2025-01-02 to 2025-02-01)...');
        yield (0, attendenceController_1.getStudentAttendance)(mockReqDuration, mockRes);
        if (resStatus === 200 && resData.success && resData.count === 2) {
            console.log('✅ Duration filter verified: Found 2 records');
        }
        else {
            console.log('❌ Duration filter failed:', { resStatus, count: resData === null || resData === void 0 ? void 0 : resData.count, message: resData === null || resData === void 0 ? void 0 : resData.message });
        }
        // 5. Test Bulk Marking (Reverted Payload)
        const bulkMarkReq = {
            body: {
                tenantId: mockTenantId.toString(),
                schoolId: mockSchoolId.toString(),
                classId: mockClassId.toString(),
                sectionId: mockSectionId.toString(),
                date: '2026-01-05',
                session: '2025-26',
                attendanceData: [
                    { studentId: mockStudentId.toString(), status: 'Present', remarks: '' },
                    { studentId: mockStudentId2.toString(), status: 'Absent', remarks: 'Medical leave' }
                ]
            },
            user: { id: new mongoose_1.default.Types.ObjectId().toString(), role: 'admin' }
        };
        console.log('Testing Bulk Marking (Reverted Payload)...');
        yield (0, attendenceController_1.markBulkAttendance)(bulkMarkReq, mockRes);
        if (resStatus === 200 && resData.success) {
            const savedRecords = yield attendence_schema_1.Attendance.find({
                date: new Date('2026-01-05'),
                tenantId: mockTenantId
            });
            if (savedRecords.length === 2) {
                console.log('✅ Bulk marking verified: 2 records saved');
                if (((_a = savedRecords[0].markedBy) === null || _a === void 0 ? void 0 : _a.role) === 'admin' && savedRecords[0].session === '2025-26') {
                    console.log('✅ Role and session verified in DB');
                }
                else {
                    console.log('❌ DB fields verification failed:', { role: (_b = savedRecords[0].markedBy) === null || _b === void 0 ? void 0 : _b.role, session: savedRecords[0].session });
                }
            }
            else {
                console.log('❌ Bulk marking verification failed: Found', savedRecords.length, 'records');
            }
        }
        else {
            console.log('❌ Bulk marking request failed:', resData);
        }
        // 6. Test Enhanced Student Attendance Retrieval (Filters & Pagination)
        console.log('Testing Enhanced Student Attendance Retrieval...');
        // 6a. Page 1, Limit 1
        const mockReqPage1 = {
            params: { studentId: mockStudentId.toString() },
            query: {
                tenantId: mockTenantId.toString(),
                schoolId: mockSchoolId.toString(),
                classId: mockClassId.toString(),
                page: '1',
                limit: '1'
            }
        };
        yield (0, attendenceController_1.getStudentAttendance)(mockReqPage1, mockRes);
        if (resStatus === 200 && resData.pagination.totalRecords >= 3 && resData.data.length === 1) {
            console.log('✅ Pagination verified (Page 1, Limit 1)');
        }
        else {
            console.log('❌ Pagination failed (Page 1):', { status: resStatus, total: (_c = resData === null || resData === void 0 ? void 0 : resData.pagination) === null || _c === void 0 ? void 0 : _c.totalRecords, dataLen: (_d = resData === null || resData === void 0 ? void 0 : resData.data) === null || _d === void 0 ? void 0 : _d.length });
        }
        // 6b. Status filter
        const mockReqStatus = {
            params: { studentId: mockStudentId.toString() },
            query: {
                tenantId: mockTenantId.toString(),
                schoolId: mockSchoolId.toString(),
                classId: mockClassId.toString(),
                status: 'Absent'
            }
        };
        yield (0, attendenceController_1.getStudentAttendance)(mockReqStatus, mockRes);
        if (resStatus === 200 && resData.count === 1 && resData.data[0].status === 'Absent') {
            console.log('✅ Status filter verified');
        }
        else {
            console.log('❌ Status filter failed:', { status: resStatus, count: resData === null || resData === void 0 ? void 0 : resData.count, dataStatus: (_f = (_e = resData === null || resData === void 0 ? void 0 : resData.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.status });
        }
        // 6c. Specific date filter
        const mockReqDate = {
            params: { studentId: mockStudentId.toString() },
            query: {
                tenantId: mockTenantId.toString(),
                schoolId: mockSchoolId.toString(),
                classId: mockClassId.toString(),
                date: '2025-01-01'
            }
        };
        yield (0, attendenceController_1.getStudentAttendance)(mockReqDate, mockRes);
        if (resStatus === 200 && resData.count === 1) {
            console.log('✅ Specific date filter verified');
        }
        else {
            console.log('❌ Specific date filter failed:', { status: resStatus, count: resData === null || resData === void 0 ? void 0 : resData.count });
        }
        // 7. Test Bulk Update (PUT)
        const updateUserId = new mongoose_1.default.Types.ObjectId();
        const bulkUpdateReq = {
            body: {
                tenantId: mockTenantId.toString(),
                schoolId: mockSchoolId.toString(),
                classId: mockClassId.toString(),
                sectionId: mockSectionId.toString(),
                date: '2026-01-05', // Same date as bulk mark
                session: '2025-26',
                attendanceData: [
                    { studentId: mockStudentId.toString(), status: 'Absent', remarks: 'Updated to absent' }
                ]
            },
            user: { id: updateUserId.toString(), role: 'admin' }
        };
        console.log('Testing Bulk Update (PUT)...');
        yield (0, attendenceController_1.updateBulkAttendance)(bulkUpdateReq, mockRes);
        if (resStatus === 200 && resData.success) {
            const updatedRecord = yield attendence_schema_1.Attendance.findOne({
                studentId: mockStudentId,
                date: new Date('2026-01-05'),
                tenantId: mockTenantId
            });
            if (updatedRecord && updatedRecord.status === 'Absent' && updatedRecord.remarks === 'Updated to absent') {
                console.log('✅ Bulk update verified in DB');
                if (((_h = (_g = updatedRecord.updatedBy) === null || _g === void 0 ? void 0 : _g.user) === null || _h === void 0 ? void 0 : _h.toString()) === updateUserId.toString()) {
                    console.log('✅ updatedBy verified');
                    if (((_j = updatedRecord.markedBy) === null || _j === void 0 ? void 0 : _j.role) === 'admin') {
                        console.log('✅ original markedBy preserved');
                    }
                    else {
                        console.log('❌ markedBy changed unexpectedly');
                    }
                }
                else {
                    console.log('❌ updatedBy verification failed:', updatedRecord.updatedBy);
                }
            }
            else {
                console.log('❌ Bulk update data verification failed');
            }
        }
        else {
            console.log('❌ Bulk update request failed:', resData);
        }
        // 8. Test Section Attendance Retrieval
        const sectionReq = {
            params: { sectionId: mockSectionId.toString() },
            query: {
                tenantId: mockTenantId.toString(),
                schoolId: mockSchoolId.toString(),
                classId: mockClassId.toString(),
                date: '2025-01-01',
                page: '1',
                limit: '10'
            }
        };
        console.log('Testing Section Attendance Retrieval...');
        yield (0, attendenceController_1.getSectionAttendance)(sectionReq, mockRes);
        if (resStatus === 200 && resData.success && resData.pagination.totalRecords === 1) {
            console.log('✅ Section attendance verified: Found 1 record for 2025-01-01');
        }
        else {
            console.log('❌ Section attendance failed:', { resStatus, total: (_k = resData === null || resData === void 0 ? void 0 : resData.pagination) === null || _k === void 0 ? void 0 : _k.totalRecords, message: resData === null || resData === void 0 ? void 0 : resData.message });
        }
        // 9. Test Error Logging
        console.log('Testing Error Logging...');
        // Trigger a validation error (missing tenantId)
        const errorReq = {
            params: { studentId: mockStudentId.toString() },
            query: {
                // tenantId missing
                schoolId: mockSchoolId.toString(),
                classId: mockClassId.toString(),
            }
        };
        yield (0, attendenceController_1.getStudentAttendance)(errorReq, mockRes);
        // Check if error was logged
        const errorLog = yield mongoose_1.default.model('ErrorLog').findOne({
            message: 'Validation Error: tenantId is required.',
            userId: (_l = errorReq.user) === null || _l === void 0 ? void 0 : _l.id
        }).sort({ createdAt: -1 });
        if (errorLog && errorLog.metadata && errorLog.metadata.query) {
            console.log('✅ Error logging verified: Validation error logged to DB');
        }
        else {
            console.log('❌ Error logging failed: No log found or incorrect details', errorLog);
        }
        // 7. Cleanup
        yield attendence_schema_1.Attendance.deleteMany({ tenantId: mockTenantId });
        yield mongoose_1.default.model('ErrorLog').deleteMany({}); // Clean up logs
        console.log('Cleanup complete');
        yield mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
        console.log('--- Verification Finished ---');
    }
    catch (err) {
        console.error('Verification script error:', err);
        process.exit(1);
    }
});
runVerification();
