import mongoose from 'mongoose';
import UserModel, { IUser } from '../models/users.schema';
import { Student } from '../models/student/student.schema';
import * as dotenv from 'dotenv';
dotenv.config();

async function debug() {
    try {
        await mongoose.connect(process.env.MONGODB_SECRET_URI as string);
        const userId = '69764a2a25ffdb4e0b3da4ec';

        console.log('--- User Info ---');
        const user = await UserModel.findById(userId).lean() as IUser | null;
        if (!user) {
            console.log('User not found');
            return;
        }
        console.log('User found:', JSON.stringify({
            _id: user._id,
            tenantId: user.tenantId,
            schoolId: user.schoolId,
            userType: user.userType,
            enrollment: user.enrollment,
            linkedStudentIds: user.linkedStudentIds
        }, null, 2));

        const studentId = user.enrollment?.studentId || (user.linkedStudentIds && user.linkedStudentIds[0]);
        console.log('\n--- Student Link ---');
        console.log('Identified studentId:', studentId);

        if (studentId) {
            const student = await Student.findOne({ _id: studentId }).lean();
            if (student) {
                console.log('Student record found:', JSON.stringify({
                    _id: student._id,
                    tenantId: student.tenantId,
                    schoolId: student.schoolId,
                    firstName: student.firstName,
                    lastName: student.lastName
                }, null, 2));

                const tenantMatch = student.tenantId === user.tenantId;
                const schoolMatch = student.schoolId?.toString() === user.schoolId?.toString();

                console.log('\n--- Match Check ---');
                console.log('Tenant Match:', tenantMatch);
                console.log('School Match:', schoolMatch);
            } else {
                console.log('Student record NOT found in database');
            }
        } else {
            console.log('No studentId linked to this user');
        }

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
