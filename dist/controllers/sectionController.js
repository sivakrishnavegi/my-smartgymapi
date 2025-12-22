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
exports.updateSectionsByClass = exports.getSectionsByClass = exports.assignHomeroomTeacher = exports.deleteSection = exports.updateSection = exports.getSectionById = exports.getSections = exports.createSection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schools_schema_1 = __importDefault(require("../models/schools.schema"));
const section_model_1 = require("../models/section.model");
const users_schema_1 = __importDefault(require("../models/users.schema"));
const class_model_1 = require("../models/class.model");
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
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid section ID!" });
        }
        const section = yield section_model_1.SectionModel.findById(id);
        if (!section)
            return res.status(404).json({ message: "Section not found!" });
        return res.status(200).json({ data: section });
    }
    catch (error) {
        console.error(error);
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
