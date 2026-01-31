
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import UserModel from '@iam/models/users.schema';
import { SectionModel } from '@academics/models/section.model';
import { SubjectModel } from '@academics/models/subject.model';
import { ClassModel } from '@academics/models/class.model';
import TeacherProfileModel from '../models/TeacherProfile';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const addMockTeachersAndAssign = async () => {
    try {
        console.log('--- Starting Mock Teacher Generation & Assignment ---');

        const mongoUri = process.env.MONGODB_SECRET_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGODB_SECRET_URI is missing");
            process.exit(1);
        }
        await mongoose.connect(mongoUri);

        const tenantId = '03254a3f-8c89-4a32-ae74-75e68f8062f1';
        const schoolId = '68a92f1ca69d89189e2f6df6';

        // 1. Ensure Class & Section Exist
        console.log('1. Ensuring Class/Section...');
        let classDoc = await ClassModel.findOne({ tenantId, schoolId, name: 'Grade 10' });
        if (!classDoc) {
            classDoc = await ClassModel.create({
                tenantId, schoolId, name: 'Grade 10', code: 'G10', academicSession: '2025-2026'
            });
            console.log('Created Class:', classDoc._id);
        } else {
            console.log('Using Class:', classDoc._id);
        }

        let sectionDoc = await SectionModel.findOne({ tenantId, schoolId, classId: classDoc._id, sectionName: 'Section A' });
        if (!sectionDoc) {
            // Fetch a user for createdBy
            const creator = await UserModel.findOne({ tenantId });
            sectionDoc = await SectionModel.create({
                tenantId, schoolId, classId: classDoc._id, sectionName: 'Section A', sectionCode: 'G10-A', isActive: true,
                createdBy: creator?._id || new mongoose.Types.ObjectId()
            });
            // Link section to class if not linked (assuming class model has sections array)
            if (!classDoc.sections?.includes(sectionDoc._id as any)) {
                classDoc.sections = [...(classDoc.sections || []), sectionDoc._id as any];
                await classDoc.save();
            }
            console.log('Created Section:', sectionDoc._id);
        } else {
            console.log('Using Section:', sectionDoc._id);
        }

        // 2. Create Mock Teachers
        console.log('2. Creating Mock Teachers...');
        const teacherData = [
            { firstName: 'Alice', lastName: 'Johnson', email: 'alice.math@test.com', subject: 'Mathematics' },
            { firstName: 'Bob', lastName: 'Smith', email: 'bob.physics@test.com', subject: 'Physics' },
            { firstName: 'Charlie', lastName: 'Brown', email: 'charlie.chem@test.com', subject: 'Chemistry' }
        ];

        const teacherMap: Record<string, any> = {}; // subject -> teacherDoc

        for (const t of teacherData) {
            let user = await UserModel.findOne({ 'account.primaryEmail': t.email });
            if (!user) {
                // Default password hash for 'teacher123'
                const passwordHash = await bcrypt.hash('teacher123', 12);

                user = await UserModel.create({
                    tenantId,
                    schoolId,
                    userType: 'teacher',
                    profile: { firstName: t.firstName, lastName: t.lastName },
                    account: {
                        primaryEmail: t.email,
                        status: 'inactive', // Default inactive as per requirement
                        username: t.email.split('@')[0],
                        passwordHash: passwordHash
                    }
                });
                console.log(`Created User: ${t.firstName} ${t.lastName}`);
            }

            // Upsert Profile
            await TeacherProfileModel.findOneAndUpdate(
                { userId: user._id },
                {
                    tenantId, schoolId, userId: user._id, staffId: `STAFF-${user._id.toString().substring(0, 6)}`,
                    specialization: [t.subject]
                },
                { upsert: true, new: true }
            );

            teacherMap[t.subject] = user;
        }

        // 3. Create Subjects for this Section
        console.log('3. Creating Subjects...');
        const subjectsData = [
            { name: 'Advanced Mathematics', code: 'MATH-ADV', creditHours: 4, type: 'Mathematics' },
            { name: 'Applied Physics', code: 'PHY-APP', creditHours: 3, type: 'Physics' },
            { name: 'Organic Chemistry', code: 'CHEM-ORG', creditHours: 3, type: 'Chemistry' }
        ];

        const subjectMap: Record<string, any> = {};

        for (const s of subjectsData) {
            // Use findOneAndUpdate to ensure we get the doc and don't duplicate unique code within section
            // If validation fails in controller, logic here matches it.
            // But for script simplicity we use findOne then create if missing or update.
            let subject = await SubjectModel.findOne({
                tenantId, schoolId, classId: classDoc._id, sectionId: sectionDoc._id, code: s.code
            });

            if (!subject) {
                subject = await SubjectModel.create({
                    tenantId, schoolId, classId: classDoc._id, sectionId: sectionDoc._id,
                    name: s.name, code: s.code, creditHours: s.creditHours
                });
                console.log(`Created Subject: ${s.name}`);
            }
            subjectMap[s.type] = subject;
        }

        // 4. Assign Teachers to Subjects in Section (Merge Logic)
        console.log('4. Assigning Teachers to Subjects...');

        // We will simulate the API payload structure
        const assignmentPayload: any[] = [];

        // Math Teacher -> Math Subject
        if (teacherMap['Mathematics'] && subjectMap['Mathematics']) {
            assignmentPayload.push({
                subjectId: subjectMap['Mathematics']._id,
                teacherId: teacherMap['Mathematics']._id
            });
        }

        // Physics Teacher -> Physics Subject
        if (teacherMap['Physics'] && subjectMap['Physics']) {
            assignmentPayload.push({
                subjectId: subjectMap['Physics']._id,
                teacherId: teacherMap['Physics']._id
            });
        }

        // Chemistry Teacher -> Chemistry Subject
        if (teacherMap['Chemistry'] && subjectMap['Chemistry']) {
            assignmentPayload.push({
                subjectId: subjectMap['Chemistry']._id,
                teacherId: teacherMap['Chemistry']._id
            });
        }

        // Use loop to update section subjects manually to mimic controller "Merge" logic
        // OR we can just update the doc directly since this is a script, but let's follow logic

        const validSubjects = sectionDoc.subjects || [];

        for (const assignment of assignmentPayload) {
            const idx = validSubjects.findIndex((s: any) => s.subjectId.toString() === assignment.subjectId.toString());
            if (idx > -1) {
                validSubjects[idx].teacherId = assignment.teacherId;
            } else {
                validSubjects.push(assignment);
            }
        }

        sectionDoc.subjects = validSubjects;

        // 5. Assign Homeroom Teacher (e.g., Math Teacher)
        if (teacherMap['Mathematics']) {
            sectionDoc.homeroomTeacherId = teacherMap['Mathematics']._id;
            console.log('Assigned Homeroom Teacher:', teacherMap['Mathematics'].profile.firstName);
        }

        await sectionDoc.save();
        console.log('✅ Section Updated with Subjects and Teachers');

        // 6. Verify result
        console.log('6. Verification Summary:');
        const updatedSection = await SectionModel.findById(sectionDoc._id)
            .populate('subjects.subjectId', 'name')
            .populate('subjects.teacherId', 'profile.firstName')
            .populate('homeroomTeacherId', 'profile.firstName');

        console.log(`Section: ${updatedSection?.sectionName}`);
        console.log(`Homeroom Teacher: ${(updatedSection?.homeroomTeacherId as any)?.profile?.firstName}`);
        console.log('Subjects:');
        updatedSection?.subjects?.forEach((s: any) => {
            console.log(` - ${s.subjectId?.name}: ${(s.teacherId as any)?.profile?.firstName || 'Unassigned'}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('--- Finished ---');
    }
};

addMockTeachersAndAssign();
