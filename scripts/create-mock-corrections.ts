import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AttendanceCorrection as AttendanceCorrectionModel } from '../src/modules/academics/models/attendanceCorrection.schema';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || 'mongodb://localhost:27017/mygymapi';

const mockData = [
    {
        studentName: "Krishna Verma",
        studentId: "69861b78047f5baa0782b8d0",
        attendanceId: "6986d4ae86de74f4f6867ad6",
        requestedStatus: "Late",
        reason: "Bus was delayed due to heavy rain."
    },
    {
        studentName: "Diya Patel",
        studentId: "69861c59993ef64fde6de190",
        attendanceId: "6986d4ae86de74f4f6867ad7",
        requestedStatus: "Excuse",
        reason: "Had a dentist appointment in the morning."
    },
    {
        studentName: "Shaurya Sharma",
        studentId: "69861b78047f5baa0782b8d4",
        attendanceId: "6986d4ae86de74f4f6867ad8",
        requestedStatus: "Absent",
        reason: "Family emergency, couldn't attend."
    },
    {
        studentName: "Sai Chopra",
        studentId: "69861c59993ef64fde6de194",
        attendanceId: "6986d4ae86de74f4f6867ad9",
        requestedStatus: "Late",
        reason: "Woke up late, sorry."
    },
    {
        studentName: "Reyansh Patel",
        studentId: "69861c59993ef64fde6de198",
        attendanceId: "6986d4ae86de74f4f6867ada",
        requestedStatus: "Excuse",
        reason: "Representing school in Inter-school sports."
    }
];

const sharedContext = {
    tenantId: "03254a3f-8c89-4a32-ae74-75e68f8062f1",
    schoolId: "68a92f1ca69d89189e2f6df6",
    classId: "69622b51e2c53f91048628a1",
    sectionId: "692a9ebf35db4e0cb6c69d78",
    requestedBy: "697f6978ab12de6fb3ddbbbd", // Using the same teacher ID as requester for mock
    role: "Teacher (on behalf of student)"
};

async function createMockCorrections() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing pending mock corrections for these students to avoid duplicates if run multiple times
        await AttendanceCorrectionModel.deleteMany({
            studentId: { $in: mockData.map(m => new mongoose.Types.ObjectId(m.studentId)) },
            status: 'Pending'
        });

        const requests = mockData.map(item => ({
            ...sharedContext,
            studentId: new mongoose.Types.ObjectId(item.studentId),
            attendanceId: new mongoose.Types.ObjectId(item.attendanceId),
            currentStatus: "Present",
            requestedStatus: item.requestedStatus,
            reason: item.reason,
            status: "Pending",
            requestedBy: new mongoose.Types.ObjectId(sharedContext.requestedBy)
        }));

        await AttendanceCorrectionModel.insertMany(requests);
        console.log(`Successfully created ${requests.length} mock correction requests.`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error creating mock corrections:', error);
        process.exit(1);
    }
}

createMockCorrections();
