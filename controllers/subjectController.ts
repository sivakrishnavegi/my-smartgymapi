
import { Request, Response } from "express";
import { SubjectModel } from "../models/subject.model";
import { ClassModel } from "../models/class.model";
import { SectionModel } from "../models/section.model";
import { logError } from "../utils/errorLogger";
import { isValidObjectId } from "mongoose";

/**
 * Create a new subject
 * POST /api/subjects
 */
export const createSubject = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId, classId, sectionId, name, code, creditHours } = req.body;

        if (!tenantId || !schoolId || !classId || !sectionId || !name || !code) {
            return res.status(400).json({ message: "Missing required fields: tenantId, schoolId, classId, sectionId, name, code" });
        }

        if (!isValidObjectId(classId) || !isValidObjectId(sectionId)) {
            return res.status(400).json({ message: "Invalid classId or sectionId format" });
        }

        // Check if Class exists and belongs to Tenant/School
        const classDoc = await ClassModel.findOne({ _id: classId, tenantId, schoolId });
        if (!classDoc) {
            return res.status(404).json({ message: "Class not found or access denied" });
        }

        // Check if Section exists and belongs to Tenant/School/Class
        // Note: Section model usually has classId or related check, but standard is checking existence in tenant/school
        const sectionDoc = await SectionModel.findOne({ _id: sectionId, tenantId, schoolId });
        if (!sectionDoc) {
            return res.status(404).json({ message: "Section not found or access denied" });
        }

        // Check for duplicate code in the SAME section
        const existing = await SubjectModel.findOne({ tenantId, schoolId, classId, sectionId, code });
        if (existing) {
            return res.status(409).json({ message: "Subject code already exists in this section" });
        }

        const subject = await SubjectModel.create({
            tenantId,
            schoolId,
            classId,
            sectionId,
            name,
            code,
            creditHours
        });

        return res.status(201).json({ message: "Subject created successfully", data: subject });
    } catch (error) {
        console.error("Create Subject Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

/**
 * Get subjects
 * GET /api/subjects
 * Query Params: tenantId, schoolId, classId, sectionId (Required)
 */

export const getSubjects = async (req: Request, res: Response) => {
    try {
        // Handle both flat and nested params (params[key])
        let queryParams = (req.query.params || req.query) as any;

        // Robust Fallback: Check manual URL params if tenantId missing
        // This handles cases where Express query parser (simple) doesn't parse 'params[key]' as object
        if (!queryParams?.tenantId && req.originalUrl.includes('?')) {
            try {
                const url = new URL(req.originalUrl, `http://${req.headers.host || 'localhost'}`);
                const sp = url.searchParams;
                // Check if we have the specific nested keys we need
                if (sp.has('params[tenantId]')) {
                    queryParams = {
                        tenantId: sp.get('params[tenantId]'),
                        schoolId: sp.get('params[schoolId]'),
                        classId: sp.get('params[classId]'),
                        sectionId: sp.get('params[sectionId]'),
                        ...queryParams // Keep any other parsed keys
                    };
                }
            } catch (e) {
                console.error("Manual param parsing error:", e);
            }
        }

        const { tenantId, schoolId, classId, sectionId } = queryParams;

        if (!tenantId || !schoolId || !classId || !sectionId) {
            return res.status(400).json({ message: "tenantId, schoolId, classId, and sectionId are required" });
        }

        const subjects = await SubjectModel.find({ tenantId, schoolId, classId, sectionId }).lean();

        return res.status(200).json({ message: "Subjects fetched successfully", data: subjects });
    } catch (error) {
        console.error("Get Subjects Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

/**
 * Update Subject
 * PATCH /api/subjects/:id
 */
export const updateSubject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code, creditHours } = req.body;

        const subject = await SubjectModel.findById(id);
        if (!subject) return res.status(404).json({ message: "Subject not found" });

        if (code && code !== subject.code) {
            // Check duplicate if code is changing within the same section
            const existing = await SubjectModel.findOne({
                tenantId: subject.tenantId,
                schoolId: subject.schoolId,
                classId: subject.classId,
                sectionId: subject.sectionId,
                code
            });
            if (existing) {
                return res.status(409).json({ message: "Subject code already exists in this section" });
            }
            subject.code = code;
        }

        if (name) subject.name = name;
        if (creditHours !== undefined) subject.creditHours = creditHours;

        await subject.save();
        return res.status(200).json({ message: "Subject updated successfully", data: subject });

    } catch (error) {
        console.error("Update Subject Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

/**
 * Delete Subject
 * DELETE /api/subjects/:id
 */
export const deleteSubject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const subject = await SubjectModel.findByIdAndDelete(id);
        if (!subject) return res.status(404).json({ message: "Subject not found" });

        return res.status(200).json({ message: "Subject deleted successfully" });
    } catch (error) {
        console.error("Delete Subject Error:", error);
        await logError(req, error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
