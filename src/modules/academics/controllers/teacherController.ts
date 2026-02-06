
import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "@iam/models/users.schema";
import TeacherProfile from "@academics/models/TeacherProfile";
import SchoolModel from "@academics/models/schools.schema";
import { ClassModel } from "@academics/models/class.model";
import { SectionModel } from "@academics/models/section.model";
import { Attendance } from "@academics/models/attendence.schema";
import { Student } from "@academics/models/student.schema";
import AcademicYearModel from "@academics/models/academicYear.schema";
import { logError } from '@shared/utils/errorLogger';

// Upsert (Create/Update) Teacher Profile
export const upsertTeacherProfile = async (req: Request, res: Response) => {
    try {
        const {
            tenantId,
            schoolId,
            userId,
            staffId,
            deptId,
            hireDate,
            qualifications,
            specialization,
        } = req.body;

        // 1. Basic Validation
        if (!tenantId || !schoolId || !userId || !staffId) {
            return res.status(400).json({
                message: "tenantId, schoolId, userId, and staffId are required!",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(schoolId)
        ) {
            return res.status(400).json({ message: "Invalid ID format!" });
        }

        // 2. Tenant & School Scoping
        const schoolExists = await SchoolModel.findOne({ _id: schoolId, tenantId });
        if (!schoolExists) {
            return res.status(404).json({ message: "School not found or does not belong to tenant!" });
        }

        // 3. User Validation (Must be a teacher and belong to tenant/school)
        const user = await User.findOne({
            _id: userId,
            tenantId,
            schoolId,
            userType: "teacher",
        });

        if (!user) {
            return res.status(404).json({ message: "Teacher user not found or permission denied!" });
        }

        // 4. Upsert Profile
        // We search by userId. 
        let profile = await TeacherProfile.findOne({ userId });

        if (profile) {
            // Update
            profile.staffId = staffId || profile.staffId;
            if (deptId && mongoose.Types.ObjectId.isValid(deptId)) profile.deptId = deptId;
            if (hireDate) profile.hireDate = new Date(hireDate);
            if (qualifications) profile.qualifications = qualifications;
            if (specialization) profile.specialization = specialization;

            await profile.save();
            return res.status(200).json({ message: "Teacher profile updated successfully", data: profile });
        } else {
            // Create
            const newProfile = await TeacherProfile.create({
                userId,
                staffId,
                deptId: (deptId && mongoose.Types.ObjectId.isValid(deptId)) ? deptId : undefined,
                hireDate: hireDate ? new Date(hireDate) : new Date(),
                qualifications: qualifications || [],
                specialization: specialization || [],
                subjects: []
            });
            return res.status(201).json({ message: "Teacher profile created successfully", data: newProfile });
        }

    } catch (error) {
        console.error("Upsert Teacher Profile Error:", error);
        await logError(req, error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// Get Teacher Profile
export const getTeacherProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { tenantId, schoolId } = req.query;

        if (!tenantId || !schoolId) {
            return res.status(400).json({ message: "tenantId and schoolId are required!" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId!" });
        }

        // Check user first for scope
        const user = await User.findOne({
            _id: userId,
            tenantId,
            schoolId,
            userType: "teacher"
        })
            .lean();

        if (!user) {
            return res.status(404).json({ message: "Teacher user not found!" });
        }

        const profile = await TeacherProfile.findOne({ userId })
            .populate("subjects", "name code")
            .lean();

        // Combine user info with profile info for a complete view
        const fullProfile = {
            ...user,
            professionalDetails: profile || null
        };

        return res.status(200).json({ message: "Teacher profile fetched", data: fullProfile });

    } catch (error) {
        console.error("Get Teacher Profile Error:", error);
        await logError(req, error);
        return res.status(500).json({ message: "Server Error" });
    }
};

/**
 * Get classes and sections assigned to a specific teacher
 * - Classes where they are the class teacher
 * - Sections where they are the homeroom teacher
 * - Sections where they teach one or more subjects
 */
export const getTeacherClassesAndSections = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { tenantId, schoolId } = req.query;

        if (!tenantId || !schoolId) {
            return res.status(400).json({ message: "tenantId and schoolId are required!" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId!" });
        }

        // 1. Find all sections where the teacher is involved (Homeroom or Subject Teacher)
        const sections = await SectionModel.find({
            tenantId,
            schoolId,
            $or: [
                { homeroomTeacherId: userId },
                { "subjects.teacherId": userId }
            ]
        })
            .populate("subjects.subjectId", "name code") // Populate subject details
            .lean();

        const sectionIds = sections.map(s => s._id.toString());

        /**
         * 2. Find classes related to the teacher:
         * - Where they are the primary Class Teacher
         * - OR which contain any of the sections where they are involved
         */
        const classes = await ClassModel.find({
            tenantId,
            schoolId,
            $or: [
                { classTeacher: userId },
                { sections: { $in: sectionIds } }
            ]
        })
            .populate({
                path: "sections",
                populate: {
                    path: "subjects.subjectId",
                    select: "name code"
                }
            }) // Populate all sections and their subjects for context
            .lean();

        // 3. Structure the response
        const result = classes.map(cls => {
            const assignedSections = (cls.sections || []).filter((sec: any) =>
                sectionIds.includes(sec._id.toString()) ||
                cls.classTeacher?.toString() === userId
            );

            return {
                _id: cls._id,
                name: cls.name,
                code: cls.code,
                isPrimaryClassTeacher: cls.classTeacher?.toString() === userId,
                sections: assignedSections.map((sec: any) => ({
                    _id: sec._id,
                    sectionName: sec.sectionName,
                    sectionCode: sec.sectionCode,
                    isHomeroomTeacher: sec.homeroomTeacherId?.toString() === userId,
                    assignedSubjects: (sec.subjects || [])
                        .filter((sub: any) => sub.teacherId?.toString() === userId)
                        .map((sub: any) => ({
                            _id: sub.subjectId?._id || sub.subjectId,
                            name: sub.subjectId?.name || "Unknown",
                            code: sub.subjectId?.code || "N/A",
                            classId: cls._id,
                            sectionId: sec._id
                        }))
                }))
            };
        });

        // 4. Calculate Stats for Dashboard
        const totalStudentsCount = await Student.countDocuments({
            tenantId,
            schoolId,
            $or: [
                { classId: { $in: classes.map(c => c._id) } },
                { sectionId: { $in: sectionIds } }
            ],
            status: "Active"
        });

        // Calculate Average Attendance
        const attendanceStats = await Attendance.aggregate([
            {
                $match: {
                    tenantId,
                    schoolId,
                    sectionId: { $in: sectionIds.map(id => new mongoose.Types.ObjectId(id)) }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPresent: {
                        $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
                    },
                    totalRecords: { $sum: 1 }
                }
            }
        ]);

        const avgAttendance = attendanceStats.length > 0
            ? ((attendanceStats[0].totalPresent / attendanceStats[0].totalRecords) * 100).toFixed(1)
            : "0.0";

        // Syllabus Progress (Mocked based on Term/Date if no model exists)
        // We'll use 68.0 as a default or calculate based on date if academic year is found
        let syllabusProgress = 68.0;
        const activeYear = await AcademicYearModel.findOne({ tenantId, isActive: true });
        if (activeYear) {
            const now = new Date();
            const start = new Date(activeYear.startDate);
            const end = new Date(activeYear.endDate);
            if (now > start && now < end) {
                syllabusProgress = Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100);
            }
        }

        const stats = {
            activeClasses: classes.length,
            assignedThisTerm: result.reduce((acc, cls) => acc + cls.sections.length, 0), // Count of assigned sections
            totalStudents: totalStudentsCount,
            avgAttendance: `${avgAttendance}%`,
            syllabusProgress: `${syllabusProgress}%`
        };

        return res.status(200).json({
            success: true,
            message: "Assigned classes and sections fetched successfully",
            stats,
            data: result
        });

    } catch (error) {
        console.error("Get Teacher Classes and Sections Error:", error);
        await logError(req, error);
        return res.status(500).json({ message: "Server Error" });
    }
};
