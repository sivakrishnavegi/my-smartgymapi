"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudent = exports.addStudentToSection = exports.getStudentsBySection = exports.updateSectionsByClass = exports.getSectionsByClass = exports.assignHomeroomTeacher = exports.deleteSection = exports.updateSection = exports.getSectionById = exports.getSections = exports.createSection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schools_schema_1 = __importDefault(require("../models/schools.schema"));
const section_model_1 = require("../models/section.model");
const users_schema_1 = __importDefault(require("../models/users.schema"));
const class_model_1 = require("../models/class.model");
const student_schema_1 = require("../models/student/student.schema");
// Create a new section
const createSection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tenantId, schoolId, sectionName, sectionCode, isActive } = req.body;
        // Validation
        if (!tenantId || !schoolId || !sectionName) {
            return res
                .status(400)
                .json({ message: "tenantId, schoolId,  and name are required!" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(schoolId)) {
            return res.status(400).json({ message: "Invalid schoolId " });
        }
        // Check if school exists
        const schoolExists = yield schools_schema_1.default.findById(schoolId);
        if (!schoolExists)
            return res.status(404).json({ message: "School not found!" });
        // Check duplicate section name for the same class
        const existingSection = yield section_model_1.SectionModel.findOne({
            sectionName,
            sectionCode,
        });
        if (existingSection)
            return res
                .status(409)
                .json({
                message: "Section with this name ,sectionCode already exists in the class!",
            });
        const newSection = yield section_model_1.SectionModel.create({
            tenantId,
            schoolId,
            sectionName,
            sectionCode,
            isActive,
            createdBy: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
        return res
            .status(201)
            .json({ message: "Section created successfully", data: newSection });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.createSection = createSection;
// Get all sections (optionally filter by tenantId, schoolId, classId)
const getSections = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantId, schoolId, classId } = req.query;
        const filter = {};
        if (tenantId)
            filter.tenantId = tenantId;
        if (schoolId)
            filter.schoolId = schoolId;
        if (classId)
            filter.classId = classId;
        const sections = yield section_model_1.SectionModel.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ sections: sections });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.getSections = getSections;
// Get section by ID
const getSectionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { tenantId, schoolId } = req.query;
        // Validate section ID
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid section ID!" });
        }
        // Validate required query parameters
        if (!tenantId || !schoolId) {
            return res.status(400).json({
                message: "tenantId and schoolId are required!"
            });
        }
        // Validate schoolId format
        if (!mongoose_1.default.Types.ObjectId.isValid(schoolId)) {
            return res.status(400).json({ message: "Invalid schoolId format!" });
        }
        // Check if school exists
        const schoolExists = yield schools_schema_1.default.findById(schoolId);
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
        const section = yield section_model_1.SectionModel.findById(id)
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
        const students = yield student_schema_1.Student.find({
            sectionId: id,
            status: "Active"
        })
            .select("admissionNo rollNo firstName middleName lastName dob gender contact.email contact.phone status")
            .sort({ rollNo: 1 })
            .lean();
        // Construct complete section response
        const sectionResponse = Object.assign(Object.assign({}, section), { students: students, studentCount: students.length });
        return res.status(200).json({
            message: "Section fetched successfully",
            data: sectionResponse
        });
    }
    catch (error) {
        console.error("Get Section By ID Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.getSectionById = getSectionById;
// Update a section
const updateSection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { sectionName, isActive, sectionCode } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid section ID!" });
        }
        const section = yield section_model_1.SectionModel.findById(id);
        if (!section) {
            return res.status(404).json({ message: "Section not found!" });
        }
        if (sectionName && sectionName !== section.sectionName) {
            const existingSection = yield section_model_1.SectionModel.findOne({
                sectionCode: section.sectionCode,
                sectionName,
            });
            if (existingSection) {
                return res.status(409).json({
                    message: "Section with this name already exists in the class!",
                });
            }
        }
        if (sectionName !== undefined)
            section.sectionName = sectionName;
        if (isActive !== undefined)
            section.isActive = isActive;
        if (sectionCode !== undefined)
            section.sectionCode = sectionCode;
        yield section.save();
        return res
            .status(200)
            .json({ message: "Section updated successfully", data: section });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.updateSection = updateSection;
// Delete a section
const deleteSection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid section ID!" });
        }
        const section = yield section_model_1.SectionModel.findById(id);
        if (!section)
            return res.status(404).json({ message: "Section not found!" });
        yield section.deleteOne();
        return res.status(200).json({ message: "Section deleted successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.deleteSection = deleteSection;
const assignHomeroomTeacher = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sectionId, teacherId } = req.body;
        // Check if teacher exists and is of type "teacher"
        const teacher = yield users_schema_1.default.findOne({
            _id: teacherId,
            userType: "teacher",
        });
        if (!teacher)
            return res.status(404).json({ message: "Teacher not found" });
        // Assign teacher to section
        const section = yield section_model_1.SectionModel.findByIdAndUpdate(sectionId, { homeroomTeacherId: teacher._id }, { new: true });
        if (!section)
            return res.status(404).json({ message: "Section not found" });
        res.status(200).json({ message: "Teacher assigned successfully", section });
    }
    catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.assignHomeroomTeacher = assignHomeroomTeacher;
// Get sections assigned to a particular class
const getSectionsByClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({ message: "Invalid class ID!" });
        }
        const classWithSections = yield class_model_1.ClassModel.findById(classId)
            .populate("sections")
            .lean();
        if (!classWithSections) {
            return res.status(404).json({ message: "Class not found!" });
        }
        return res.status(200).json({
            message: "Sections fetched successfully",
            data: classWithSections.sections || [],
        });
    }
    catch (error) {
        console.error("Get Sections By Class Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.getSectionsByClass = getSectionsByClass;
// Update sections for a particular class
const updateSectionsByClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classId } = req.params;
        const { sections, tenantId, schoolId } = req.body;
        // 1. Validation
        if (!mongoose_1.default.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({ message: "Invalid class ID!" });
        }
        if (!Array.isArray(sections)) {
            return res.status(400).json({ message: "sections must be an array of IDs!" });
        }
        // 2. Find Class
        const classObj = yield class_model_1.ClassModel.findById(classId);
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
            if (!mongoose_1.default.Types.ObjectId.isValid(sectionId)) {
                return res.status(400).json({ message: `Invalid section ID: ${sectionId}` });
            }
            const sectionExists = yield section_model_1.SectionModel.exists({ _id: sectionId });
            if (!sectionExists) {
                return res.status(404).json({ message: `Section not found: ${sectionId}` });
            }
        }
        // 5. Update
        classObj.sections = sections;
        yield classObj.save();
        return res.status(200).json({
            message: "Sections updated successfully",
            data: classObj.sections,
        });
    }
    catch (error) {
        console.error("Update Sections By Class Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.updateSectionsByClass = updateSectionsByClass;
// Get students by section with pagination and search
const getStudentsBySection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sectionId } = req.params;
        const { tenantId, schoolId, classId, page = "1", limit = "10", search } = req.query;
        // 1. Validation
        if (!mongoose_1.default.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({ message: "Invalid section ID!" });
        }
        if (!tenantId || !schoolId || !classId) {
            return res.status(400).json({
                message: "tenantId, schoolId, and classId are required!",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(schoolId)) {
            return res.status(400).json({ message: "Invalid schoolId format!" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({ message: "Invalid classId format!" });
        }
        // 2. Verify school exists and belongs to tenant
        const schoolExists = yield schools_schema_1.default.findById(schoolId);
        if (!schoolExists) {
            return res.status(404).json({ message: "School not found!" });
        }
        if (schoolExists.tenantId !== tenantId) {
            return res.status(403).json({
                message: "Unauthorized: School does not belong to this tenant!",
            });
        }
        // 3. Verify class exists and belongs to school
        const classExists = yield class_model_1.ClassModel.findById(classId);
        if (!classExists) {
            return res.status(404).json({ message: "Class not found!" });
        }
        if (classExists.schoolId.toString() !== schoolId) {
            return res.status(403).json({
                message: "Unauthorized: Class does not belong to this school!",
            });
        }
        // Check if section belongs to class
        const isSectionInClass = (classExists.sections || []).some((sec) => sec.toString() === sectionId);
        if (!isSectionInClass) {
            return res.status(400).json({
                message: "Section does not belong to the specified class!",
            });
        }
        // 4. Verify section exists and belongs to tenant/school/class
        const section = yield section_model_1.SectionModel.findById(sectionId);
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
        const query = {
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
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // 7. Fetch students with pagination
        const [students, totalRecords] = yield Promise.all([
            student_schema_1.Student.find(query)
                .select("admissionNo rollNo firstName middleName lastName dob gender contact guardians status academic documents")
                .sort({ rollNo: 1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            student_schema_1.Student.countDocuments(query),
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
    }
    catch (error) {
        console.error("Get Students By Section Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.getStudentsBySection = getStudentsBySection;
// Add a student to a section
const addStudentToSection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { sectionId } = req.params;
        const { tenantId, schoolId, classId, admissionNo, rollNo, firstName, middleName, lastName, dob, gender, contact, guardians, documents, status, admissionDate, } = req.body;
        // 1. Validation
        if (!tenantId || !schoolId || !classId || !sectionId) {
            return res.status(400).json({
                message: "tenantId, schoolId, classId, and sectionId are required!",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(schoolId) ||
            !mongoose_1.default.Types.ObjectId.isValid(classId) ||
            !mongoose_1.default.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({ message: "Invalid ID format!" });
        }
        // 2. Verify School
        const schoolExists = yield schools_schema_1.default.findOne({
            _id: schoolId,
            tenantId,
        });
        if (!schoolExists) {
            return res.status(404).json({
                message: "School not found or does not belong to the tenant!",
            });
        }
        // 3. Verify Class
        const classExists = yield class_model_1.ClassModel.findOne({
            _id: classId,
            schoolId,
        });
        if (!classExists) {
            return res.status(404).json({
                message: "Class not found or does not belong to the school!",
            });
        }
        // 4. Verify Section
        const sectionExists = yield section_model_1.SectionModel.findOne({
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
        const isSectionLinked = (classExists.sections || []).some((sec) => sec.toString() === sectionId);
        if (!isSectionLinked) {
            return res.status(400).json({
                message: "Section does not belong to the specified class!",
            });
        }
        // 5. Check Duplicate Admission Number
        const existingStudent = yield student_schema_1.Student.findOne({
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
        const newStudent = yield student_schema_1.Student.create({
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
            createdBy: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
        return res.status(201).json({
            message: "Student added successfully",
            data: newStudent,
        });
    }
    catch (error) {
        console.error("Add Student To Section Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.addStudentToSection = addStudentToSection;
// Get a specific student details
const getStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sectionId = req.params.sectionId;
        const studentId = req.params.studentId;
        const tenantId = req.query.tenantId;
        const schoolId = req.query.schoolId;
        const classId = req.query.classId;
        if (!sectionId || !studentId || !tenantId || !schoolId || !classId) {
            return res.status(400).json({
                message: 'sectionId, studentId, tenantId, schoolId, and classId are required',
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(sectionId) ||
            !mongoose_1.default.Types.ObjectId.isValid(studentId) ||
            !mongoose_1.default.Types.ObjectId.isValid(schoolId) ||
            !mongoose_1.default.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        // School
        const schoolExists = yield schools_schema_1.default.findOne({
            _id: schoolId,
            tenantId,
        });
        if (!schoolExists) {
            return res.status(404).json({ message: 'School not found' });
        }
        // Class
        const classExists = yield class_model_1.ClassModel.findOne({
            _id: classId,
            schoolId,
        });
        if (!classExists) {
            return res.status(404).json({ message: 'Class not found' });
        }
        // Section
        const sectionExists = yield section_model_1.SectionModel.findOne({
            _id: sectionId,
            schoolId,
            tenantId,
        });
        if (!sectionExists) {
            return res.status(404).json({ message: 'Section not found' });
        }
        const student = yield student_schema_1.Student.findOne({
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
    }
    catch (error) {
        console.error('Get Student Error:', error);
        return res.status(500).json({ message: 'Server Error' });
    }
});
exports.getStudent = getStudent;
