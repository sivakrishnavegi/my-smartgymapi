
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Student } from '../models/student/student.schema';
import { Attendance } from '../models/student/attendence.schema';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const addMockAttendance = async () => {
    try {
        // 1. Connect to MongoDB
        const mongoUri = process.env.MONGODB_SECRET_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGODB_SECRET_URI is missing in env");
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const studentId = '6958fe65fd67f69877d61a50';
        console.log(`Finding student: ${studentId}...`);

        // 2. Get Student details
        const student = await Student.findById(studentId);
        if (!student) {
            console.error('Student not found!');
            process.exit(1);
        }

        const { tenantId, schoolId, classId, sectionId } = student;
        console.log(`Found student. Tenant: ${tenantId}, School: ${schoolId}, Class: ${classId}, Section: ${sectionId}`);

        // 3. Loop through January 2026
        const startDate = new Date('2026-01-01');
        const endDate = new Date('2026-01-31');
        const loopDate = new Date(startDate);

        let createdCount = 0;

        while (loopDate <= endDate) {
            // Skip if already exists
            const existing = await Attendance.findOne({
                studentId,
                date: loopDate,
            });

            if (!existing) {
                // Determine status
                const day = loopDate.getDay();
                let status = 'Present';

                // Weekends
                if (day === 0 || day === 6) {
                    // Maybe skip weekends or mark as something else? 
                    // Schema enum: ["Present", "Absent", "Late", "Excuse"]
                    // I'll just skip creating records for weekends to be realistic
                    loopDate.setDate(loopDate.getDate() + 1);
                    continue;
                }

                // Randomly assign some Absences/Lates
                const rand = Math.random();
                if (rand < 0.1) status = 'Absent';
                else if (rand < 0.2) status = 'Late';

                await Attendance.create({
                    tenantId,
                    schoolId,
                    classId,
                    sectionId,
                    studentId,
                    date: new Date(loopDate), // Clone date!
                    status,
                    session: '2025-2026', // Assuming current session
                    markedBy: {
                        role: 'Script',
                        at: new Date()
                    }
                });
                createdCount++;
                process.stdout.write('.');
            } else {
                process.stdout.write('s'); // s for skipped
            }

            loopDate.setDate(loopDate.getDate() + 1);
        }

        console.log(`\n\n✅ Mock attendance data generated.`);
        console.log(`Created: ${createdCount} records.`);

        process.exit(0);

    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

addMockAttendance();
