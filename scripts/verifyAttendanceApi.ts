import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getStudentAttendance, markBulkAttendance, getSectionAttendance } from '../controllers/attendenceController';
import { Attendance as StudentAttendanceModel } from '../models/student/attendence.schema';
import '../models/student/student.schema'; // Ensure Student model is registered
import '../models/section.model'; // Ensure Section model is registered
import '../models/class.model'; // Ensure Class model is registered
import '../models/schools.schema'; // Ensure School model is registered
import '../models/users.schema'; // Ensure User model is registered

dotenv.config();

const runVerification = async () => {
    try {
        console.log('--- Starting Verification ---');

        // 1. Connect to DB
        const mongoUri = process.env.MONGODB_SECRET_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_SECRET_URI not found in environment');
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // 2. Seed Mock Data
        const mockStudentId = new mongoose.Types.ObjectId();
        const mockStudentId2 = new mongoose.Types.ObjectId();
        const mockSchoolId = new mongoose.Types.ObjectId();
        const mockClassId = new mongoose.Types.ObjectId();
        const mockSectionId = new mongoose.Types.ObjectId();
        const mockTenantId = new mongoose.Types.ObjectId();

        const attendanceRecords: any[] = [
            {
                studentId: mockStudentId,
                schoolId: mockSchoolId,
                classId: mockClassId,
                sectionId: mockSectionId,
                tenantId: mockTenantId,
                date: new Date('2025-01-01'),
                status: 'Present',
                academicYear: '2024-25',
                markedBy: { user: new mongoose.Types.ObjectId(), role: 'teacher', at: new Date() }
            },
            {
                studentId: mockStudentId,
                schoolId: mockSchoolId,
                classId: mockClassId,
                sectionId: mockSectionId,
                tenantId: mockTenantId,
                date: new Date('2025-01-02'),
                status: 'Absent',
                academicYear: '2024-25',
                markedBy: { user: new mongoose.Types.ObjectId(), role: 'teacher', at: new Date() }
            },
            {
                studentId: mockStudentId,
                schoolId: mockSchoolId,
                classId: mockClassId,
                sectionId: mockSectionId,
                tenantId: mockTenantId,
                date: new Date('2025-02-01'),
                status: 'Present',
                academicYear: '2024-25',
                markedBy: { user: new mongoose.Types.ObjectId(), role: 'teacher', at: new Date() }
            }
        ];

        await StudentAttendanceModel.insertMany(attendanceRecords);
        console.log('Mock attendance records seeded');

        let resData: any = null;
        let resStatus: number = 0;

        const mockRes = {
            status: (code: number) => {
                resStatus = code;
                return {
                    json: (data: any) => {
                        resData = data;
                    }
                };
            }
        } as any;

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
        } as any;

        console.log('Testing Month Filter (January 2025)...');
        await getStudentAttendance(mockReqMonth, mockRes);

        // Note: Retrievals might fail until session -> academicYear is fixed in controller
        if (resStatus === 200 && resData.success && resData.count === 2) {
            console.log('✅ Month filter verified: Found 2 records for January');
        } else {
            console.log('❌ Month filter failed:', { resStatus, count: resData?.count, message: resData?.message });
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
        } as any;

        console.log('Testing Duration Filter (2025-01-02 to 2025-02-01)...');
        await getStudentAttendance(mockReqDuration, mockRes);

        if (resStatus === 200 && resData.success && resData.count === 2) {
            console.log('✅ Duration filter verified: Found 2 records');
        } else {
            console.log('❌ Duration filter failed:', { resStatus, count: resData?.count, message: resData?.message });
        }

        // 5. Test Bulk Marking (New Payload)
        const bulkMarkReq = {
            body: {
                tenantId: mockTenantId.toString(),
                schoolId: mockSchoolId.toString(),
                classId: mockClassId.toString(),
                sectionId: mockSectionId.toString(),
                date: '2026-01-05',
                academicYear: '2025-26',
                records: [
                    { studentId: mockStudentId.toString(), status: 'Present', remarks: '' },
                    { studentId: mockStudentId2.toString(), status: 'Absent', remarks: 'Medical leave' }
                ]
            },
            user: { id: new mongoose.Types.ObjectId().toString(), role: 'admin' }
        } as any;

        console.log('Testing Bulk Marking (New Payload)...');
        await markBulkAttendance(bulkMarkReq, mockRes);

        if (resStatus === 200 && resData.success) {
            const savedRecords = await StudentAttendanceModel.find({
                date: new Date('2026-01-05'),
                tenantId: mockTenantId
            });
            if (savedRecords.length === 2) {
                console.log('✅ Bulk marking verified: 2 records saved');
                if (savedRecords[0].markedBy?.role === 'admin' && savedRecords[0].academicYear === '2025-26') {
                    console.log('✅ Role and academicYear verified in DB');
                } else {
                    console.log('❌ DB fields verification failed:', { role: savedRecords[0].markedBy?.role, year: savedRecords[0].academicYear });
                }
            } else {
                console.log('❌ Bulk marking verification failed: Found', savedRecords.length, 'records');
            }
        } else {
            console.log('❌ Bulk marking request failed:', resData);
        }

        // 6. Test Section Attendance Retrieval
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
        } as any;

        console.log('Testing Section Attendance Retrieval...');
        await getSectionAttendance(sectionReq, mockRes);

        if (resStatus === 200 && resData.success && resData.pagination.totalRecords === 1) {
            console.log('✅ Section attendance verified: Found 1 record for 2025-01-01');
        } else {
            console.log('❌ Section attendance failed:', { resStatus, total: resData?.pagination?.totalRecords, message: resData?.message });
        }

        // 7. Cleanup
        await StudentAttendanceModel.deleteMany({ tenantId: mockTenantId });
        console.log('Cleanup complete');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        console.log('--- Verification Finished ---');

    } catch (err) {
        console.error('Verification script error:', err);
        process.exit(1);
    }
};

runVerification();
