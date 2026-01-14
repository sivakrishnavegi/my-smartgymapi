import { Request, Response } from "express";
import mongoose from "mongoose";
import SchoolModel from "../models/schools.schema";
import { SectionModel } from "../models/section.model";
import UserModel from "../models/users.schema";
import { ClassModel } from "../models/class.model";
import { Student } from "../models/student/student.schema";
import { logError } from '../utils/errorLogger';
import bcrypt from "bcrypt";
import { SubjectModel } from "../models/subject.model";

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
      createdBy: (req as any)?.user?.id,
    });

    return res
      .status(201)
      .json({ message: "Section created successfully", data: newSection });
  } catch (error) {
    console.error(error);
    await logError(req, error);
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
    await logError(req, error);
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
    await logError(req, error);
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
    await logError(req, error);
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
    await logError(req, error);
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
    await logError(req, err);
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
    await logError(req, error);
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

    // 5. Check for conflicts: Ensure sections aren't already assigned to OTHER classes
    const conflictingClasses = await ClassModel.find({
      _id: { $ne: classId },
      sections: { $in: sections }
    }).select('sections');

    const claimedSectionIds = new Set<string>();
    conflictingClasses.forEach(cls => {
      if (cls.sections) {
        cls.sections.forEach(secId => {
          if (sections.includes(secId.toString())) {
            claimedSectionIds.add(secId.toString());
          }
        });
      }
    });

    // Valid sections are those NOT claimed by other classes
    const validSections = sections.filter((secId: string) => !claimedSectionIds.has(secId));

    // 6. Update
    classObj.sections = validSections;
    await classObj.save();

    return res.status(200).json({
      message: "Sections updated successfully",
      data: classObj.sections,
    });
  } catch (error) {
    console.error("Update Sections By Class Error:", error);
    await logError(req, error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get students by section with pagination and search
export const getStudentsBySection = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { tenantId, schoolId, classId, page = "1", limit = "10", search } = req.query;

    // 1. Validation
    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({ message: "Invalid section ID!" });
    }

    if (!tenantId || !schoolId || !classId) {
      return res.status(400).json({
        message: "tenantId, schoolId, and classId are required!",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(schoolId as string)) {
      return res.status(400).json({ message: "Invalid schoolId format!" });
    }

    if (!mongoose.Types.ObjectId.isValid(classId as string)) {
      return res.status(400).json({ message: "Invalid classId format!" });
    }

    // 2. Verify school exists and belongs to tenant
    const schoolExists = await SchoolModel.findById(schoolId);
    if (!schoolExists) {
      return res.status(404).json({ message: "School not found!" });
    }

    if (schoolExists.tenantId !== tenantId) {
      return res.status(403).json({
        message: "Unauthorized: School does not belong to this tenant!",
      });
    }

    // 3. Verify class exists and belongs to school
    const classExists = await ClassModel.findById(classId);
    if (!classExists) {
      return res.status(404).json({ message: "Class not found!" });
    }

    if (classExists.schoolId.toString() !== schoolId) {
      return res.status(403).json({
        message: "Unauthorized: Class does not belong to this school!",
      });
    }

    // Check if section belongs to class
    const isSectionInClass = (classExists.sections || []).some(
      (sec: any) => sec.toString() === sectionId
    );

    if (!isSectionInClass) {
      return res.status(400).json({
        message: "Section does not belong to the specified class!",
      });
    }

    // 4. Verify section exists and belongs to tenant/school/class
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Section not found!" });
    }

    if (section.tenantId !== tenantId) {
      return res.status(403).json({
        message: "Unauthorized: Section does not belong to this tenant!",
      });
    }

    if (section.schoolId.toString() !== schoolId) {
      return res.status(403).json({
        message: "Unauthorized: Section does not belong to this school!",
      });
    }

    // 5. Build query for students
    const query: any = {
      sectionId: sectionId,
      classId: classId,
      schoolId: schoolId,
      tenantId: tenantId,
      status: "Active",
    };

    // Add search filter if provided
    if (search && typeof search === "string") {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { admissionNo: { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } },
      ];
    }

    // 6. Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // 7. Fetch students with pagination
    const [students, totalRecords] = await Promise.all([
      Student.find(query)
        .select(
          "admissionNo rollNo firstName middleName lastName dob gender contact guardians status academic documents"
        )
        .sort({ rollNo: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Student.countDocuments(query),
    ]);

    // 8. Calculate pagination metadata
    const totalPages = Math.ceil(totalRecords / limitNum);

    return res.status(200).json({
      message: "Students fetched successfully",
      data: {
        students,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalRecords,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("Get Students By Section Error:", error);
    await logError(req, error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Add a student to a section
export const addStudentToSection = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const {
      tenantId,
      schoolId,
      classId,
      admissionNo,
      rollNo,
      firstName,
      middleName,
      lastName,
      dob,
      gender,
      contact,
      guardians,
      documents,
      status,
      admissionDate,
    } = req.body;

    // 1. Validation
    if (!tenantId || !schoolId || !classId || !sectionId) {
      return res.status(400).json({
        message: "tenantId, schoolId, classId, and sectionId are required!",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(schoolId) ||
      !mongoose.Types.ObjectId.isValid(classId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({ message: "Invalid ID format!" });
    }

    // 2. Verify School
    const schoolExists = await SchoolModel.findOne({
      _id: schoolId,
      tenantId,
    });
    if (!schoolExists) {
      return res.status(404).json({
        message: "School not found or does not belong to the tenant!",
      });
    }

    // 3. Verify Class
    const classExists = await ClassModel.findOne({
      _id: classId,
      schoolId,
    });
    if (!classExists) {
      return res.status(404).json({
        message: "Class not found or does not belong to the school!",
      });
    }

    // 4. Verify Section
    const sectionExists = await SectionModel.findOne({
      _id: sectionId,
      schoolId: schoolId,
      tenantId: tenantId,
    });

    if (!sectionExists) {
      return res.status(404).json({
        message: "Section not found or mismatch with filters!",
      });
    }

    // Helper: Check if section is actually in the class's section list
    const isSectionLinked = (classExists.sections || []).some(
      (sec: any) => sec.toString() === sectionId
    );
    if (!isSectionLinked) {
      return res.status(400).json({
        message: "Section does not belong to the specified class!",
      });
    }

    // 5. Check Duplicate Admission Number
    const existingStudent = await Student.findOne({
      admissionNo,
      tenantId,
      schoolId,
    });
    if (existingStudent) {
      return res.status(409).json({
        message: `Student with admission number ${admissionNo} already exists in this school!`,
      });
    }

    // 6. Create Student
    const newStudent = await Student.create({
      tenantId,
      schoolId,
      classId,
      sectionId,
      admissionNo,
      rollNo,
      firstName,
      middleName,
      lastName,
      dob,
      gender,
      contact,
      guardians,
      documents,
      admissionDate: admissionDate || new Date(),
      status: status || "Active",
      academic: {
        currentClass: classId,
        currentSection: sectionId,
        history: [
          {
            classId,
            sectionId,
            session: classExists.academicSession,
          },
        ],
      },
      createdBy: (req as any)?.user?.id,
    });


    // 7. Auto-Create User Account
    try {
      // Default password hash
      const defaultPassword = "Student@123";
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

      // Create User
      const newUser = await UserModel.create({
        tenantId,
        schoolId,
        userType: "student",
        profile: {
          firstName,
          lastName,
          dob,
          gender,
          contact, // reuse contact details
        },
        account: {
          username: admissionNo.toLowerCase(), // Use lowercase admission number as username
          primaryEmail: contact?.email || undefined,
          passwordHash,
          status: "inactive",
        },
        roles: [], // Optionally fetch and add 'student' role if exists
        linkedStudentIds: [newStudent._id],
        enrollment: {
          studentId: newStudent._id,
          classId,
          sectionId,
          regNo: admissionNo // Use admissionNo or let system generate regNo
        },
        createdBy: (req as any)?.user?.id,
      });

      console.log(`[AddStudent] User account created for student ${newStudent._id}`);

    } catch (userError) {
      console.error("[AddStudent] Failed to create user account:", userError);
      // We don't fail the request if user creation fails, but we log it.
      // Alternatively, we could delete the student and fail. 
      // For now, logging is safer to avoid data loss of the student record.
      await logError(req, userError);
    }

    return res.status(201).json({
      message: "Student added successfully",
      data: newStudent,
    });
  } catch (error) {
    console.error("Add Student To Section Error:", error);
    await logError(req, error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get a specific student details
export const getStudent = async (req: Request, res: Response) => {
  try {

    const sectionId = req.params.sectionId as string;
    const studentId = req.params.studentId as string;

    const tenantId = req.query.tenantId as string;
    const schoolId = req.query.schoolId as string;
    const classId = req.query.classId as string;

    if (!sectionId || !studentId || !tenantId || !schoolId || !classId) {
      return res.status(400).json({
        message:
          'sectionId, studentId, tenantId, schoolId, and classId are required',
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(sectionId) ||
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(schoolId) ||
      !mongoose.Types.ObjectId.isValid(classId)
    ) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // School
    const schoolExists = await SchoolModel.findOne({
      _id: schoolId,
      tenantId,
    });
    if (!schoolExists) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Class
    const classExists = await ClassModel.findOne({
      _id: classId,
      schoolId,
    });
    if (!classExists) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Section
    const sectionExists = await SectionModel.findOne({
      _id: sectionId,
      schoolId,
      tenantId,
    });
    if (!sectionExists) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const student = await Student.findOne({
      _id: studentId,
      tenantId,
      schoolId,
      classId,
      sectionId,
    })
      .populate('academic.currentClass', 'name code')
      .populate('academic.currentSection', 'sectionName sectionCode')
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }


    return res.status(200).json({
      message: 'Student fetched successfully',
      data: student,
    });
  } catch (error) {
    console.error('Get Student Error:', error);
    await logError(req, error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Assign subjects and teachers to a section
export const assignSubjects = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { tenantId, schoolId, subjects } = req.body; // subjects: [{ subjectId, teacherId }]

    if (!tenantId || !schoolId || !sectionId) {
      return res.status(400).json({ message: "tenantId, schoolId, and sectionId are required!" });
    }

    if (!Array.isArray(subjects)) {
      return res.status(400).json({ message: "subjects must be an array!" });
    }

    const section = await SectionModel.findOne({ _id: sectionId, tenantId, schoolId });
    if (!section) {
      return res.status(404).json({ message: "Section not found or access denied!" });
    }


    // Initialize validSubjects with existing subjects (or empty array)
    const validSubjects = section.subjects || [];

    for (const item of subjects) {
      if (!item.subjectId) continue;

      // Verify subject belongs to tenant/school AND this specific section
      const subjectDoc = await SubjectModel.findOne({ _id: item.subjectId, tenantId, schoolId });
      if (!subjectDoc) {
        return res.status(400).json({ message: `Invalid subject ID: ${item.subjectId}` });
      }

      // Ensure subject is created for THIS section
      if (subjectDoc.sectionId.toString() !== sectionId) {
        return res.status(400).json({ message: `Subject ${item.subjectId} belongs to a different section!` });
      }

      // Verify teacher if provided
      if (item.teacherId) {
        const teacherDoc = await UserModel.findOne({ _id: item.teacherId, tenantId, schoolId, userType: 'teacher' });
        if (!teacherDoc) {
          return res.status(400).json({ message: `Invalid teacher ID: ${item.teacherId}` });
        }
      }

      // Check if subject is already assigned to this section
      const existingIndex = validSubjects.findIndex((s: any) => s.subjectId.toString() === item.subjectId);

      if (existingIndex > -1) {
        // Update existing assignment
        validSubjects[existingIndex].teacherId = item.teacherId || undefined;
      } else {
        // Add new assignment
        validSubjects.push({
          subjectId: item.subjectId,
          teacherId: item.teacherId || undefined
        });
      }
    }

    section.subjects = validSubjects;
    await section.save();

    return res.status(200).json({ message: "Subjects assigned successfully", data: section.subjects });

  } catch (error) {
    console.error("Assign Subjects Error:", error);
    await logError(req, error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get subjects for a section
export const getSectionSubjects = async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { tenantId, schoolId } = req.query;

    if (!tenantId || !schoolId || !sectionId) {
      return res.status(400).json({ message: "tenantId, schoolId, and sectionId are required!" });
    }

    const section = await SectionModel.findOne({ _id: sectionId, tenantId, schoolId })
      .populate('subjects.subjectId', 'name code creditHours')
      .populate('subjects.teacherId', 'profile.firstName profile.lastName account.primaryEmail')
      .lean();

    if (!section) {
      return res.status(404).json({ message: "Section not found!" });
    }

    return res.status(200).json({
      message: "Section subjects fetched",
      data: section.subjects || []
    });

  } catch (error) {
    console.error("Get Section Subjects Error:", error);
    await logError(req, error);
    return res.status(500).json({ message: "Server Error" });
  }
};


