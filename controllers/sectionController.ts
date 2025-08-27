import { Request, Response } from "express";
import mongoose from "mongoose";
import SchoolModel from "../models/schools.schema";
import { SectionModel } from "../models/section.model";
import UserModel from "../models/users.schema";

// Create a new section
export const createSection = async (req: Request, res: Response) => {
  try {
    const { tenantId, schoolId, sectionName, sectionCode, isActive } = req.body;

    // Validation
    if (!tenantId || !schoolId || !sectionName) {
      return res
        .status(400)
        .json({ message: "tenantId, schoolId,  and name are required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({ message: "Invalid schoolId " });
    }

    // Check if school exists
    const schoolExists = await SchoolModel.findById(schoolId);
    if (!schoolExists)
      return res.status(404).json({ message: "School not found!" });

    // Check duplicate section name for the same class
    const existingSection = await SectionModel.findOne({
      sectionName,
      sectionCode,
    });
    if (existingSection)
      return res
        .status(409)
        .json({
          message:
            "Section with this name ,sectionCode already exists in the class!",
        });

    const newSection = await SectionModel.create({
      tenantId,
      schoolId,
      sectionName,
      sectionCode,
      isActive,
      createdBy: req?.user?.id,
    });

    return res
      .status(201)
      .json({ message: "Section created successfully", data: newSection });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get all sections (optionally filter by tenantId, schoolId, classId)
export const getSections = async (req: Request, res: Response) => {
  try {
    const { tenantId, schoolId, classId } = req.query;
    const filter: any = {};
    if (tenantId) filter.tenantId = tenantId;
    if (schoolId) filter.schoolId = schoolId;
    if (classId) filter.classId = classId;

    const sections = await SectionModel.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ sections: sections });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get section by ID
export const getSectionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid section ID!" });
    }

    const section = await SectionModel.findById(id);
    if (!section)
      return res.status(404).json({ message: "Section not found!" });

    return res.status(200).json({ data: section });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Update a section
export const updateSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sectionName, isActive, sectionCode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid section ID!" });
    }

    const section = await SectionModel.findById(id);
    if (!section) {
      return res.status(404).json({ message: "Section not found!" });
    }

    if (sectionName && sectionName !== section.sectionName) {
      const existingSection = await SectionModel.findOne({
        sectionCode: section.sectionCode,
        sectionName,
      });
      if (existingSection) {
        return res.status(409).json({
          message: "Section with this name already exists in the class!",
        });
      }
    }

    if (sectionName !== undefined) section.sectionName = sectionName;
    if (isActive !== undefined) section.isActive = isActive;
    if (sectionCode !== undefined) section.sectionCode = sectionCode;

    await section.save();

    return res
      .status(200)
      .json({ message: "Section updated successfully", data: section });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};


// Delete a section
export const deleteSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid section ID!" });
    }

    const section = await SectionModel.findById(id);
    if (!section)
      return res.status(404).json({ message: "Section not found!" });

    await section.deleteOne();
    return res.status(200).json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const assignHomeroomTeacher = async (req: Request, res: Response) => {
  try {
    const { sectionId, teacherId } = req.body;

    // Check if teacher exists and is of type "teacher"
    const teacher = await UserModel.findOne({
      _id: teacherId,
      userType: "teacher",
    });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Assign teacher to section
    const section = await SectionModel.findByIdAndUpdate(
      sectionId,
      { homeroomTeacherId: teacher._id },
      { new: true }
    );

    if (!section) return res.status(404).json({ message: "Section not found" });

    res.status(200).json({ message: "Teacher assigned successfully", section });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
