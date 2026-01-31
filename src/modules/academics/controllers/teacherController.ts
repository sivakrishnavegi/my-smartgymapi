
import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "@iam/models/users.schema";
import TeacherProfile from "@academics/models/TeacherProfile";
import SchoolModel from "@academics/models/schools.schema";
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
