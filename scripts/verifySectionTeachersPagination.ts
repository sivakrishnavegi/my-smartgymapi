
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/ds';
import { SectionModel } from '@academics/models/section.model';
import UserModel from '@iam/models/users.schema';
import { getSectionTeachers } from '@academics/controllers/sectionController';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

const run = async () => {
    try {
        await connectDB();
        console.log("DB Connected");

        const tenantId = "verify-pagination-teachers";
        const schoolId = new mongoose.Types.ObjectId().toString();
        const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

        // 1. Create Teachers
        console.log("Creating Teachers...");
        const teachers = [];
        for (let i = 0; i < 15; i++) {
            const teacher = await UserModel.create({
                tenantId,
                schoolId: schoolObjectId,
                userType: 'teacher',
                profile: {
                    firstName: `Teacher ${i}`,
                    lastName: `Test`,
                    contact: { email: `teacher${i}-${Date.now()}@test.com` }
                },
                account: {
                    primaryEmail: `teacher${i}-${Date.now()}@test.com`,
                    passwordHash: 'hash',
                    status: 'active'
                },
                createdBy: new mongoose.Types.ObjectId()
            });
            teachers.push(teacher);
        }
        console.log(`Created ${teachers.length} teachers`);

        // 2. Create Section & Assign Teachers
        console.log("Creating Section and Assigning...");
        const section = await SectionModel.create({
            tenantId,
            schoolId: schoolObjectId,
            sectionName: "Verify Teachers Section",
            sectionCode: `SEC-T-${Date.now()}`,
            isActive: true,
            createdBy: new mongoose.Types.ObjectId(),
            homeroomTeacherId: teachers[0]._id, // First teacher is homeroom
            subjects: teachers.slice(1).map((t, idx) => ({ // Rest are subject teachers
                subjectId: new mongoose.Types.ObjectId(),
                teacherId: t._id
            }))
        });
        const sectionId = (section as any)._id.toString();

        let expectedPage = 1;

        let res = {
            status: (code: number) => {
                console.log(`Status: ${code}`);
                return {
                    json: (body: any) => {
                        console.log(`Response P${expectedPage}:`, JSON.stringify(body, null, 2));
                        if (code !== 200) {
                            console.error("Request failed with status", code);
                            return;
                        }
                        try {
                            if (body.data.teachers.length !== 5) throw new Error(`Page ${expectedPage} should have 5 teachers, got ${body.data.teachers.length}`);
                            if (body.data.pagination.page !== expectedPage) throw new Error(`Current page should be ${expectedPage}, got ${body.data.pagination.page}`);

                            const shouldHaveNext = expectedPage < 3;
                            if (body.data.pagination.hasNextPage !== shouldHaveNext) throw new Error(`hasNextPage should be ${shouldHaveNext} for page ${expectedPage}`);
                        } catch (e) {
                            console.error("Assertion Error:", e);
                            throw e;
                        }
                    }
                };
            }
        } as unknown as Response;

        // 3. Test Pagination (Page 1, Limit 5)
        console.log("Testing Pagination (Page 1, Limit 5)...");
        let req = {
            params: { sectionId },
            query: { tenantId, schoolId, page: '1', limit: '5' }
        } as unknown as Request;

        await getSectionTeachers(req, res);

        // 4. Test Pagination (Page 2, Limit 5)
        console.log("Testing Pagination (Page 2, Limit 5)...");
        req.query.page = '2';
        expectedPage = 2;
        await getSectionTeachers(req, res);

        // 5. Test Pagination (Page 3, Limit 5)
        console.log("Testing Pagination (Page 3, Limit 5)...");
        req.query.page = '3';
        expectedPage = 3;
        await getSectionTeachers(req, res);

        // Clean up
        console.log("Cleaning up...");
        await SectionModel.deleteOne({ _id: section._id });
        await UserModel.deleteMany({ tenantId });
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
