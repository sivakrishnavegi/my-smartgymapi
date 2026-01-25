
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/ds';
import { Student } from '../models/student/student.schema';
import UserModel from '../models/users.schema';
import { ClassModel } from '../models/class.model';
import { SectionModel } from '../models/section.model';
import { ExamModel } from '../models/exam.model';
import { ResultModel } from '../models/result.model';
import { SubjectModel } from '../models/subject.model';
import SchoolModel from '../models/schools.schema';
import { getCompleteStudentDetails } from '../controllers/studentController';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

const run = async () => {
    try {
        await connectDB();
        console.log("DB Connected");

        const tenantId = "verify-complete-profile-tenant";
        const schoolObjectId = new mongoose.Types.ObjectId();
        const schoolId = schoolObjectId.toString();
        const creatorId = new mongoose.Types.ObjectId();

        // 1. Create Class & Section
        console.log("Creating Class and Section...");
        const cls = await ClassModel.create({
            tenantId,
            schoolId: schoolObjectId,
            name: "Verify Class 10",
            code: `CLS-${Date.now()}`,
            academicSession: "2024-2025",
            createdBy: creatorId
        });

        const section = await SectionModel.create({
            tenantId,
            schoolId: schoolObjectId,
            sectionName: "Section A",
            sectionCode: `SEC-${Date.now()}`,
            isActive: true,
            createdBy: creatorId,
            subjects: []
        });

        // 2. Create Student Record
        console.log("Creating Student...");
        const student = await Student.create({
            tenantId,
            schoolId: schoolObjectId,
            classId: cls._id,
            sectionId: section._id,
            admissionNo: `ADM-${Date.now()}`,
            firstName: "John",
            lastName: "Doe",
            dob: new Date("2010-01-01"),
            gender: "Male",
            createdBy: creatorId
        });
        const studentId = student._id.toString();

        // 3. Create User Account
        console.log("Creating User Account...");
        const user = await UserModel.create({
            tenantId,
            schoolId: schoolObjectId,
            userType: "student",
            profile: { firstName: "John", lastName: "Doe" },
            account: { primaryEmail: `student-${Date.now()}@test.com`, status: "active" },
            linkedStudentIds: [student._id],
            enrollment: {
                studentId: student._id,
                classId: cls._id,
                sectionId: section._id,
                regNo: student.admissionNo
            },
            createdBy: creatorId
        });

        // 4. Create Exam
        console.log("Creating Exam...");
        const exam = await ExamModel.create({
            tenantId,
            schoolId: schoolObjectId,
            academicYearId: "2024",
            title: "Mid-Term Exam",
            examType: "mid",
            classes: [cls._id],
            status: "Scheduled",
            createdBy: creatorId,
            schedule: []
        });

        // 5. Create Result
        console.log("Creating Result...");
        const subjectId = new mongoose.Types.ObjectId();
        const result = await ResultModel.create({
            tenantId,
            schoolId: schoolObjectId,
            examId: exam._id,
            studentId: user._id, // Result uses User ID
            subjectId: subjectId,
            marksObtained: 85,
            grade: "A",
            remarks: "Very Good"
        });

        // 6. Test Endpoint
        console.log("Testing getCompleteStudentDetails...");
        let req = {
            params: { studentId },
            query: { tenantId, schoolId }
        } as unknown as Request;

        let res = {
            status: (code: number) => {
                console.log(`Status: ${code}`);
                return {
                    json: (body: any) => {
                        console.log("Response Profile:", body.data.profile.firstName);
                        console.log("Response Academic Class:", body.data.academic.class?.name);
                        console.log("Response Exams Count:", body.data.exams.length);
                        console.log("Response Results Count:", body.data.results.length);

                        // Basic Assertions
                        if (code !== 200) throw new Error(`Status should be 200, got ${code}`);
                        if (body.data.profile.firstName !== "John") throw new Error("Profile name mismatch");
                        if (body.data.academic.class.name !== "Verify Class 10") throw new Error("Class name mismatch");
                        if (body.data.results.length !== 1) throw new Error("Result count mismatch");
                        if (body.data.exams.length !== 1) throw new Error("Exam count mismatch");
                    }
                };
            }
        } as unknown as Response;

        await getCompleteStudentDetails(req, res);

        // Clean up
        console.log("Cleaning up...");
        await Student.deleteOne({ _id: student._id });
        await UserModel.deleteOne({ _id: user._id });
        await ClassModel.deleteOne({ _id: cls._id });
        await SectionModel.deleteOne({ _id: section._id });
        await ExamModel.deleteOne({ _id: exam._id });
        await ResultModel.deleteOne({ _id: result._id });
        console.log("Clean up done.");

    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

run();
