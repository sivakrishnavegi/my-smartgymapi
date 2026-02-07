import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { LeaveRequest } from '../src/modules/academics/models/leaveRequest.schema';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || 'mongodb://localhost:27017/mygymapi';

const mockData = [
    {
        studentName: "Krishna Verma",
        studentId: "69861b78047f5baa0782b8d0",
        leaveType: "Sick",
        reason: "High fever and cold",
        startDate: "2026-02-07",
        endDate: "2026-02-08",
    },
    {
        studentName: "Diya Patel",
        studentId: "69861c59993ef64fde6de190",
        leaveType: "Personal",
        reason: "Family function",
        startDate: "2026-02-07",
        endDate: "2026-02-07",
    },
    {
        studentName: "Shaurya Sharma",
        studentId: "69861b78047f5baa0782b8d4",
        leaveType: "Family",
        reason: "Sister's wedding",
        startDate: "2026-02-07",
        endDate: "2026-02-10",
    },
    {
        studentName: "Sai Chopra",
        studentId: "69861c59993ef64fde6de194",
        leaveType: "Other",
        reason: "Attending a coding competition",
        startDate: "2026-02-09",
        endDate: "2026-02-11",
    },
    {
        studentName: "Reyansh Patel",
        studentId: "69861c59993ef64fde6de198",
        leaveType: "Sick",
        reason: "Chickenpox",
        startDate: "2026-02-05",
        endDate: "2026-02-15",
    }
];

const sharedContext = {
    tenantId: "03254a3f-8c89-4a32-ae74-75e68f8062f1",
    schoolId: "68a92f1ca69d89189e2f6df6",
    classId: "69622b51e2c53f91048628a1",
    sectionId: "692a9ebf35db4e0cb6c69d78",
    appliedBy: "697f6978ab12de6fb3ddbbbd", // Using a teacher/admin ID
    role: "Teacher" // or Parent/Student
};

async function createMockLeaveRequests() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Optional: clear existing for these students on these dates?
        // for now just insert

        const requests = mockData.map(item => ({
            ...sharedContext,
            studentId: new mongoose.Types.ObjectId(item.studentId),
            schoolId: new mongoose.Types.ObjectId(sharedContext.schoolId),
            classId: new mongoose.Types.ObjectId(sharedContext.classId),
            sectionId: new mongoose.Types.ObjectId(sharedContext.sectionId),
            appliedBy: new mongoose.Types.ObjectId(sharedContext.appliedBy),
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            leaveType: item.leaveType,
            reason: item.reason,
            status: "Pending"
        }));

        await LeaveRequest.insertMany(requests);
        console.log(`Successfully created ${requests.length} mock leave requests.`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error creating mock leave requests:', error);
        process.exit(1);
    }
}

createMockLeaveRequests();
