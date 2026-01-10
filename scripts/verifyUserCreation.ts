
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { addStudentToSection } from '../controllers/sectionController';
import { loginUser } from '../controllers/userController';
import UserModel from '../models/users.schema';
import { Student } from '../models/student/student.schema';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const verifyUserCreation = async () => {
    try {
        console.log('--- Starting User Creation & Login Verification ---');

        // 1. Connect to DB
        const mongoUri = process.env.MONGODB_SECRET_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGODB_SECRET_URI is missing in env");
            process.exit(1);
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const tenantId = '03254a3f-8c89-4a32-ae74-75e68f8062f1';
        const schoolId = '68a92f1ca69d89189e2f6df6';
        const classId = '6947b4696c7ce228d16fd39f';
        const sectionId = '692a9ffd6b7f55e303bbb5dc';

        const admissionNo = `TEST-${Date.now()}`; // Unique admission no

        const mockReq = {
            params: { sectionId },
            body: {
                tenantId,
                schoolId,
                classId,
                sectionId,
                admissionNo,
                firstName: 'Auto',
                lastName: 'UserTester',
                dob: new Date('2010-01-01'),
                gender: 'Male',
                contact: { email: `test.student.${Date.now()}@example.com` },
                status: 'Active'
            },
            user: { id: new mongoose.Types.ObjectId() } // mock creator
        } as any;

        const mockRes = {
            status: (code: number) => {
                return {
                    json: async (data: any) => {
                        console.log(`\nAdd Student Response Status: ${code}`);
                        if (code === 201) {
                            console.log('✅ Student Created!');
                            // verify user
                            await verifyUser(admissionNo, tenantId);
                            // verify login
                            await verifyLogin(admissionNo);
                        } else {
                            console.error('❌ Failed to create student!');
                            console.error('Error:', data);
                            process.exit(1);
                        }
                    }
                };
            }
        } as any;

        // 3. Call Controller
        console.log(`Adding student with AdmissionNo: ${admissionNo}...`);
        await addStudentToSection(mockReq, mockRes);

    } catch (err) {
        console.error('Verification script error:', err);
        process.exit(1);
    }
};

const verifyUser = async (username: string, tenantId: string) => {
    try {
        const lowerUsername = username.toLowerCase();
        console.log(`Verifying User creation for username: ${lowerUsername} (original: ${username})...`);
        const user = await UserModel.findOne({ "account.username": lowerUsername, tenantId });

        if (user) {
            console.log('✅ User found in DB!');
            if (user.userType === 'student' && user.account?.status === 'inactive') {
                console.log('✅ User fields are correct.');
            } else {
                console.error('❌ User fields match failed!');
            }
        } else {
            console.error('❌ User NOT found in DB!');
        }
    } catch (error) {
        console.error('User verification failed:', error);
        process.exit(1);
    }
}

const verifyLogin = async (username: string) => {
    try {
        console.log(`\n--- Attempting Login with Username: ${username} ---`);

        const mockLoginReq = {
            body: {
                email: username, // Controller treats 'email' field as identifier
                password: 'Student@123'
            },
            ip: '127.0.0.1',
            headers: { 'user-agent': 'VerifyScript' }
        } as any;

        const mockLoginRes = {
            setHeader: () => { }, // mock cookie setting
            status: (code: number) => {
                return {
                    json: (data: any) => {
                        console.log(`Login Response Status: ${code}`);
                        if (code === 200) {
                            console.log('✅ Login Successful!');
                            console.log('Token:', data.user?.token ? 'Received' : 'Missing');
                            cleanup(username);
                        } else {
                            console.error('❌ Login Failed!');
                            console.error('Error:', data);
                            cleanup(username);
                        }
                    }
                }
            }
        } as any;

        await loginUser(mockLoginReq, mockLoginRes);

    } catch (error) {
        console.error('Login verification failed:', error);
        cleanup(username);
    }
}

const cleanup = async (username: string) => {
    // Cleanup
    console.log('\nCleaning up...');
    await Student.deleteOne({ admissionNo: username });
    await UserModel.deleteOne({ "account.username": username.toLowerCase() });
    console.log('Cleanup complete.');

    await mongoose.disconnect();
    console.log('--- Verification Finished ---');
    process.exit(0);
}

verifyUserCreation();
