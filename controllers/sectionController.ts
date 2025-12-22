import { Request, Response } from "express";
import mongoose from "mongoose";
import SchoolModel from "../models/schools.schema";
import { SectionModel } from "../models/section.model";
import UserModel from "../models/users.schema";
import { ClassModel } from "../models/class.model";
import { Student } from "../models/student/student.schema";

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
    const { tenantId, schoolId } = req.query;

    // Validate section ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid section ID!" });
    }

    // Validate required query parameters
    if (!tenantId || !schoolId) {
      return res.status(400).json({
        message: "tenantId and schoolId are required!"
      });
    }

    // Validate schoolId format
    if (!mongoose.Types.ObjectId.isValid(schoolId as string)) {
      return res.status(400).json({ message: "Invalid schoolId format!" });
    }

    // Check if school exists
    const schoolExists = await SchoolModel.findById(schoolId);
    if (!schoolExists) {
      return res.status(404).json({ message: "School not found!" });
    }

    // Verify school belongs to tenant
    if (schoolExists.tenantId !== tenantId) {
      return res.status(403).json({
        message: "Unauthorized: School does not belong to this tenant!"
      });
    }

    // Find section and populate related data
    const section = await SectionModel.findById(id)
      .populate({
        path: "homeroomTeacherId",
        select: "userType profile.firstName profile.lastName profile.photoUrl profile.contact account.primaryEmail employment",
      })
      .populate({
        path: "schoolId",
        select: "name code address",
      })
      .populate({
        path: "createdBy",
        select: "profile.firstName profile.lastName account.primaryEmail",
      })
      .lean();

    if (!section) {
      return res.status(404).json({ message: "Section not found!" });
    }

    // Verify section belongs to the specified tenant and school
    if (section.tenantId !== tenantId) {
      return res.status(403).json({
        message: "Unauthorized: Section does not belong to this tenant!"
      });
    }

    if (section.schoolId._id.toString() !== schoolId) {
      return res.status(403).json({
        message: "Unauthorized: Section does not belong to this school!"
      });
    }

    // Get all students in this section
    const students = await Student.find({
      sectionId: id,
      status: "Active"
    })
      .select("admissionNo rollNo firstName middleName lastName dob gender contact.email contact.phone status")
      .sort({ rollNo: 1 })
      .lean();

    // Construct complete section response
    const sectionResponse = {
      ...section,
      students: students,
      studentCount: students.length,
    };

    return res.status(200).json({
      message: "Section fetched successfully",
      data: sectionResponse
    });
  } catch (error) {
    console.error("Get Section By ID Error:", error);
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

// Get sections assigned to a particular class
export const getSectionsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid class ID!" });
    }

    const classWithSections = await ClassModel.findById(classId)
      .populate("sections")
      .lean();

    if (!classWithSections) {
      return res.status(404).json({ message: "Class not found!" });
    }

    return res.status(200).json({
      message: "Sections fetched successfully",
      data: classWithSections.sections || [],
    });
  } catch (error) {
    console.error("Get Sections By Class Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Update sections for a particular class
export const updateSectionsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { sections, tenantId, schoolId } = req.body;

    // 1. Validation
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid class ID!" });
    }

    if (!Array.isArray(sections)) {
      return res.status(400).json({ message: "sections must be an array of IDs!" });
    }

    // 2. Find Class
    const classObj = await ClassModel.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: "Class not found!" });
    }

    // 3. Ownership Validation
    if (tenantId && classObj.tenantId !== tenantId) {
      return res.status(403).json({ message: "Unauthorized tenant access for this class!" });
    }
    if (schoolId && classObj.schoolId.toString() !== schoolId) {
      return res.status(403).json({ message: "Unauthorized school access for this class!" });
    }

    // 4. Verify that all section IDs are valid and exist
    for (const sectionId of sections) {
      if (!mongoose.Types.ObjectId.isValid(sectionId)) {
        return res.status(400).json({ message: `Invalid section ID: ${sectionId}` });
      }
      const sectionExists = await SectionModel.exists({ _id: sectionId });
      if (!sectionExists) {
        return res.status(404).json({ message: `Section not found: ${sectionId}` });
      }
    }

    // 5. Update
    classObj.sections = sections;
    await classObj.save();

    return res.status(200).json({
      message: "Sections updated successfully",
      data: classObj.sections,
    });
  } catch (error) {
    console.error("Update Sections By Class Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
