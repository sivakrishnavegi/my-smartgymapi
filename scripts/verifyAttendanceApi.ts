
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getStudentAttendance } from '../controllers/attendenceController';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const verifyAttendanceApi = async () => {
    try {
        console.log('--- Starting Verification ---');

        // 1. Connect to DB
        const mongoUri = process.env.MONGODB_SECRET_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGODB_SECRET_URI is missing in env");
            process.exit(1);
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // 2. Define Mock Request with Nested Params
        // The user specifically asked to verify params like params[schoolId]
        const mockReq = {
            params: { studentId: '6958fe65fd67f69877d61a50' }, // Express params
            query: {
                // Simulating flattened nested query params
                'params[tenantId]': '03254a3f-8c89-4a32-ae74-75e68f8062f1',
                'params[schoolId]': '68a92f1ca69d89189e2f6df6',
                'params[classId]': '6947b4696c7ce228d16fd39f',
                'params[studentId]': '6958fe65fd67f69877d61a50',
                'params[startDate]': '2026-01-01',
                'params[endDate]': '2026-01-31'
            }
        } as any;

        const mockRes = {
            status: (code: number) => {
                return {
                    json: (data: any) => {
                        console.log(`\nResponse Status: ${code}`);
                        if (code === 200) {
                            console.log('✅ Success!');
                            console.log('Message:', data.message);
                            console.log('Count:', data.count);
                            console.log('Pagination:', data.pagination);
                            if (data.data && data.data.length > 0) {
                                console.log(`Sample Record 1: Date=${data.data[0].date}, Status=${data.data[0].status}`);
                            }
                        } else {
                            console.error('❌ Failed!');
                            console.error('Error:', data);
                        }
                    }
                };
            }
        } as any;

        // 3. Call Controller
        console.log('Calling getStudentAttendance with nested params...');
        await getStudentAttendance(mockReq, mockRes);

    } catch (err) {
        console.error('Verification script error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\n--- Verification Finished ---');
    }
};

verifyAttendanceApi();
