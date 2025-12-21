import { Request, Response } from "express";
import { ClassModel } from "../models/class.model";
import SchoolModel from "../models/schools.schema";
import mongoose from "mongoose";
import { buildPaginationResponse, getPagination, getQueryParam } from "../utils/pagination";
import UserModel from '../models/users.schema';


const generateUniqueCode = async (): Promise<string> => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const existingClass = await ClassModel.findOne({ code });
    if (!existingClass) {
      isUnique = true;
    }
  }
  return code;
};

export const createClass = async (req: Request, res: Response) => {
  try {
    const {
      tenantId,
      schoolId,
      className,
      // section, // TODO: Handle section separately if needed
      classTeacher,
      description,
      medium,
      shift,
      isActive
    } = req.body;

    // Check all required fields
    if (!tenantId || !schoolId || !className) {
      return res.status(400).json({ message: "tenantId, schoolId, and className are required!" });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({ message: "Invalid schoolId!" });
    }

    // Check if school exists and belongs to the tenant
    const school = await SchoolModel.findOne({ _id: schoolId, tenantId });
    if (!school) {
      return res.status(404).json({ message: "School not found for this tenant!" });
    }

    // Generate unique code
    const code = await generateUniqueCode();

    const newClass = await ClassModel.create({
      tenantId,
      schoolId,
      name: className,
      code,
      description,
      medium,
      shift,
      classTeacher: classTeacher || undefined, // Only add if present
      status: isActive === true ? "Active" : "Inactive"
    });

    return res.status(201).json({ message: "Class created successfully", data: newClass });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getClasses = async (req: Request, res: Response) => {
  try {
    const tenantId = getQueryParam(req, 'tenantId');
    const schoolId = getQueryParam(req, 'schoolId');

    const filter: any = {};
    if (tenantId) filter.tenantId = tenantId;

    if (schoolId) {
      if (!mongoose.Types.ObjectId.isValid(String(schoolId))) {
        return res.status(400).json({ message: 'Invalid schoolId!' });
      }
      filter.schoolId = schoolId;
    }

    const { page, limit, skip } = getPagination(req);

    const [classes, totalCount] = await Promise.all([
      ClassModel.find(filter)
        .populate({
          path: 'classTeacher',
          select: 'account.primaryEmail', // 👈 only fetch email
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // 👈 converts to plain JS object (recommended)
      ClassModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Classes fetched successfully",
      data: classes,
      pagination: buildPaginationResponse(page, limit, totalCount),

    });
  } catch (error) {
    console.error('Get Classes Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};




export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class ID!" });
    }

    const classObj = await ClassModel.findById(id);
    if (!classObj) return res.status(404).json({ message: "Class not found!" });

    return res.status(200).json({ data: classObj });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class ID!" });
    }

    const classObj = await ClassModel.findById(id);
    if (!classObj) return res.status(404).json({ message: "Class not found!" });

    // Check for duplicate code if updating
    if (code && code !== classObj.code) {
      const existingClass = await ClassModel.findOne({ schoolId: classObj.schoolId, code });
      if (existingClass) {
        return res.status(409).json({ message: "Class code already exists in this school." });
      }
    }

    classObj.name = name || classObj.name;
    classObj.code = code || classObj.code;

    await classObj.save();
    return res.status(200).json({ message: "Class updated successfully", data: classObj });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class ID!" });
    }

    const classObj = await ClassModel.findById(id);
    if (!classObj) return res.status(404).json({ message: "Class not found!" });

    await classObj.deleteOne();
    return res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
