import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { LeaveRequest as LeaveRequestModel } from '../src/modules/academics/models/leaveRequest.schema';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || 'mongodb://localhost:27017/mygymapi';

const mockLeaves = [
    {
        studentName: "Krishna Verma",
        studentId: "69861b78047f5baa0782b8d0",
        startDate: "2026-02-10",
        endDate: "2026-02-12",
        leaveType: "Sick",
        reason: "Severe fever and cold."
    },
    {
        studentName: "Diya Patel",
        studentId: "69861c59993ef64fde6de190",
        startDate: "2026-02-15",
        endDate: "2026-02-15",
        leaveType: "Personal",
        reason: "Attending a cousin's wedding."
    }
];

const sharedContext = {
    tenantId: "03254a3f-8c89-4a32-ae74-75e68f8062f1",
    schoolId: "68a92f1ca69d89189e2f6df6",
    classId: "69622b51e2c53f91048628a1",
    sectionId: "692a9ebf35db4e0cb6c69d78",
    appliedBy: "697f6978ab12de6fb3ddbbbd",
    role: "Teacher (on behalf of student)"
};

async function createMockLeaves() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        await LeaveRequestModel.deleteMany({
            studentId: { $in: mockLeaves.map(m => new mongoose.Types.ObjectId(m.studentId)) },
            status: 'Pending'
        });

        const requests = mockLeaves.map(item => ({
            ...sharedContext,
            studentId: new mongoose.Types.ObjectId(item.studentId),
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            leaveType: item.leaveType,
            reason: item.reason,
            status: "Pending",
            appliedBy: new mongoose.Types.ObjectId(sharedContext.appliedBy)
        }));

        await LeaveRequestModel.insertMany(requests);
        console.log(`Successfully created ${requests.length} mock leave requests.`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error creating mock leaves:', error);
        process.exit(1);
    }
}

createMockLeaves();
