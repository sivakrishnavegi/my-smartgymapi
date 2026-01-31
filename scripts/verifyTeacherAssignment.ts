import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { upsertTeacherProfile } from '@academics/controllers/teacherController';
import { assignSubjects, getSectionSubjects } from '@academics/controllers/sectionController';
import { createSubject } from '@academics/controllers/subjectController'; // Import subject controller
import { SubjectModel } from '@academics/models/subject.model';
import UserModel from '@iam/models/users.schema';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const verifyTeacherAssignment = async () => {
    try {
        console.log('--- Starting Teacher Assignment Verification ---');

        const mongoUri = process.env.MONGODB_SECRET_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGODB_SECRET_URI is missing");
            process.exit(1);
        }
        await mongoose.connect(mongoUri);

        const tenantId = '03254a3f-8c89-4a32-ae74-75e68f8062f1';
        const schoolId = '68a92f1ca69d89189e2f6df6';
        const classId = '6947b4696c7ce228d16fd39f';

        // 1. Create a subject using Controller Logic
        console.log('Creating Subject via Controller...');
        const uniqueCode = `MATH-${Date.now()}`;
        const mockSubjectReq = {
            body: {
                tenantId,
                schoolId,
                classId,
                sectionId: '692a9ffd6b7f55e303bbb5dc', // Section Id
                name: 'Mathematics Advanced',
                code: uniqueCode,
                creditHours: 4
            }
        } as any;

        let subjectId: string = "";

        const mockSubjectRes = {
            status: (code: number) => ({
                json: (d: any) => {
                    console.log(`[Create Subject] ${code}`, d);
                    if (code === 201) subjectId = d.data._id.toString();
                }
            })
        } as any;

        await createSubject(mockSubjectReq, mockSubjectRes);

        // 1a. Verify Duplicate Code Check
        console.log('Verifying Duplicate Code Check...');
        await createSubject(mockSubjectReq, {
            status: (code: number) => ({
                json: (d: any) => {
                    console.log(`[Duplicate Subject Check] ${code}`, d);
                    if (code === 409) console.log('✅ Duplicate check passed');
                    else console.error('❌ Duplicate check failed');
                }
            })
        } as any);


        // 2. Identify a teacher
        let teacher = await UserModel.findOne({ userType: 'teacher', tenantId, schoolId });
        if (!teacher) {
            teacher = await UserModel.create({
                tenantId,
                schoolId,
                userType: 'teacher',
                profile: { firstName: 'Math', lastName: 'Teacher' },
                account: { status: 'active', username: `math.teacher.${Date.now()}` }
            });
        }
        console.log('Using Teacher:', teacher._id);

        // 3. Upsert Teacher Profile
        const mockProfileReq = {
            body: {
                tenantId,
                schoolId,
                userId: teacher._id.toString(),
                staffId: 'STAFF-001',
                qualifications: ['M.Sc Math'],
                specialization: ['Algebra']
            }
        } as any;
        const mockProfileRes = {
            status: (code: number) => ({ json: (d: any) => console.log(`[Profile Upsert] ${code}`, d) })
        } as any;
        await upsertTeacherProfile(mockProfileReq, mockProfileRes);

        // 4. Assign Subject to Section
        if (subjectId) {
            // 4a. Verify Section Mismatch (Create a dummy subject for another section if possible, or skip for now)
            // Just verifying valid assignment for now, assuming mismatch logic is simpler
            const sectionId = '692a9ffd6b7f55e303bbb5dc';

            console.log(`Assigning Subject ${subjectId} to Section ${sectionId}...`);
            const mockAssignReq = {
                params: { sectionId },
                body: {
                    tenantId,
                    schoolId,
                    subjects: [
                        { subjectId: subjectId, teacherId: teacher._id.toString() }
                    ]
                }
            } as any;
            const mockAssignRes = {
                status: (code: number) => ({ json: (d: any) => console.log(`[Assign Subject] ${code}`, d) })
            } as any;
            await assignSubjects(mockAssignReq, mockAssignRes);


            // 4a. Create Second Subject and Assign (to test Merge Logic)
            console.log('Creating Second Subject...');
            const code2 = `MATH-2-${Date.now()}`;
            let subjectId2 = "";
            await createSubject({
                body: { tenantId, schoolId, classId, sectionId, name: 'Applied Math', code: code2, creditHours: 3 }
            } as any, {
                status: (code: number) => ({ json: (d: any) => { if (code === 201) subjectId2 = d.data._id.toString(); } })
            } as any);

            if (subjectId2) {
                console.log(`Assigning Second Subject ${subjectId2} (Merge Test)...`);
                await assignSubjects({
                    params: { sectionId },
                    body: { tenantId, schoolId, subjects: [{ subjectId: subjectId2, teacherId: teacher._id.toString() }] }
                } as any, mockAssignRes);
            }

            // 5. Verify Assignment (Should have BOTH subjects)
            const mockGetReq = {
                params: { sectionId },
                query: { tenantId, schoolId }
            } as any;
            const mockGetRes = {
                status: (code: number) => ({
                    json: (d: any) => {
                        console.log(`[Get Subjects] ${code}`, JSON.stringify(d, null, 2));
                        if (code === 200 && d.data.length >= 2) { // Expecting at least 2 subjects now
                            console.log('Checking IDs:', subjectId, subjectId2);
                            d.data.forEach((s: any) => console.log('Found:', s.subjectId._id));
                            const hasSub1 = d.data.some((s: any) => s.subjectId._id.toString() === subjectId);
                            const hasSub2 = d.data.some((s: any) => s.subjectId._id.toString() === subjectId2);
                            console.log('Has 1:', hasSub1, 'Has 2:', hasSub2);
                            if (hasSub1 && hasSub2) console.log('✅ Merge verification successful');
                            else console.error('❌ Merge verification failed');
                        } else {
                            console.error('❌ verification failed (count mismatch)');
                        }
                    }
                })
            } as any;
            await getSectionSubjects(mockGetReq, mockGetRes);
        } else {
            console.error('❌ Skipping assignment due to subject creation failure');

        }
    } catch (error) {
        console.error("Verification Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log('--- Finished ---');
    }
};

verifyTeacherAssignment();
