import { Response } from "express";
import mongoose from "mongoose";
import { Student } from "@academics/models/student.schema";
import UserModel, { IUser } from "@iam/models/users.schema";
import { ClassModel } from "@academics/models/class.model";
import { SectionModel } from "@academics/models/section.model";
import { ExamModel } from "@academics/models/exam.model";
import { ResultModel } from "@academics/models/result.model";
import { SubjectModel } from "@academics/models/subject.model";
import SchoolModel from "@academics/models/schools.schema";
import { logError } from "@shared/utils/errorLogger";
import { AuthenticatedRequest } from "@shared/middlewares/authMiddleware";

/**
 * Get complete details of a student including academic context, exams, and results.
 * @route GET /api/students/:studentId/complete-profile
 */
export const getCompleteStudentDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let { studentId } = req.params;
        const tenantId = (req.query.tenantId as string) || req.user?.tenantId;
        const schoolId = (req.query.schoolId as string) || req.user?.schoolId;

        if (!tenantId || !schoolId) {
            return res.status(400).json({
                message: "tenantId and schoolId are required!",
            });
        }

        // 1. Identification and Authorization Logic
        if (studentId === "me") {
            const userId = req.user?.id;
            const currentUser = await UserModel.findById(userId).lean() as IUser | null;
            if (!currentUser) {
                return res.status(401).json({ message: "Authenticated user not found!" });
            }

            // A student user has enrollment.studentId; a guardian user has linkedStudentIds
            const linkedStudentId = currentUser.enrollment?.studentId || (currentUser.linkedStudentIds && currentUser.linkedStudentIds[0]);

            if (!linkedStudentId) {
                return res.status(404).json({ message: "No linked student record found for this account!" });
            }
            studentId = linkedStudentId.toString();
        } else {
            // Role-based permission check for specific studentId
            const userRole = req.user?.role;
            if (userRole === "student" || userRole === "guardian") {
                const userId = req.user?.id;
                const currentUser = await UserModel.findById(userId).lean() as IUser | null;
                const allowedIds = [
                    currentUser?.enrollment?.studentId?.toString(),
                    ...(currentUser?.linkedStudentIds?.map((id: any) => id.toString()) || [])
                ];

                if (!allowedIds.includes(studentId)) {
                    return res.status(403).json({ message: "You do not have permission to view this student's profile!" });
                }
            }
        }

        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: "Invalid studentId format!" });
        }

        // 2. Fetch Student Profile
        const student = await Student.findOne({
            _id: studentId,
            tenantId,
            schoolId,
        }).lean();

        if (!student) {
            return res.status(404).json({ message: "Student record not found!" });
        }

        // 3. Fetch User Account (linked to this student record)
        const userAccount = await UserModel.findOne({
            tenantId,
            schoolId,
            $or: [
                { linkedStudentIds: studentId },
                { "enrollment.studentId": studentId }
            ]
        }).select("-account.passwordHash").lean();

        if (!userAccount) {
            // Log warning but proceed if student record exists but user doesn't
            console.warn(`[StudentDetails] User account missing for student ${studentId}`);
        }

        // 4. Fetch Class and Section Details
        const [classData, sectionData] = await Promise.all([
            ClassModel.findOne({ _id: student.classId, schoolId, tenantId })
                .populate("classTeacher", "profile.firstName profile.lastName profile.photoUrl")
                .lean(),
            SectionModel.findOne({ _id: student.sectionId, schoolId, tenantId })
                .populate({ path: "subjects.subjectId", model: SubjectModel, select: "name code" })
                .populate({ path: "subjects.teacherId", model: UserModel, select: "profile.firstName profile.lastName profile.photoUrl" })
                .lean(),
        ]);

        // 5. Fetch Exams and Results
        // ResultModel uses the User ID (studentId field in ResultModel)
        const userAccountData = userAccount as any;
        const userId = userAccountData?._id;

        // Fetch Exams for this class
        const exams = await ExamModel.find({
            classes: student.classId,
            tenantId,
            schoolId,
            status: { $in: ["Scheduled", "Ongoing", "Completed"] }
        }).sort({ createdAt: -1 }).lean();

        // Fetch Results if user account exists
        let results: any[] = [];
        if (userId) {
            results = await ResultModel.find({
                studentId: userId,
                tenantId,
                schoolId
            })
                .populate({ path: "subjectId", model: SubjectModel, select: "name code" })
                .populate({ path: "examId", model: ExamModel, select: "title examType" })
                .sort({ createdAt: -1 })
                .lean();
        }

        // 6. Aggregate Response
        const responseData = {
            profile: {
                studentId: student._id,
                admissionNo: student.admissionNo,
                rollNo: student.rollNo,
                firstName: student.firstName,
                middleName: student.middleName,
                lastName: student.lastName,
                dob: student.dob,
                gender: student.gender,
                contact: student.contact,
                guardians: student.guardians,
                documents: student.documents,
                status: student.status,
                admissionDate: student.admissionDate,
            },
            academic: {
                class: classData ? {
                    id: (classData as any)._id,
                    name: (classData as any).name,
                    code: (classData as any).code,
                    classTeacher: (classData as any).classTeacher
                } : null,
                section: sectionData ? {
                    id: (sectionData as any)._id,
                    name: (sectionData as any).sectionName,
                    code: (sectionData as any).sectionCode,
                    subjects: (sectionData as any).subjects || []
                } : null,
                history: student.academic?.history || []
            },
            userAccount: userAccountData ? {
                id: userAccountData._id,
                username: userAccountData.account?.username,
                email: userAccountData.account?.primaryEmail,
                status: userAccountData.account?.status
            } : null,
            exams: exams.map(exam => ({
                id: (exam as any)._id,
                title: exam.title,
                type: exam.examType,
                status: exam.status,
                schedule: exam.schedule
            })),
            results: results,
            seatingPlan: [] // Currently not implemented in the data model
        };

        return res.status(200).json({
            message: "Complete student details fetched successfully",
            data: responseData,
        });

    } catch (error) {
        console.error("Get Complete Student Details Error:", error);
        await logError(req, error);
        return res.status(500).json({ message: "Server Error" });
    }
};
