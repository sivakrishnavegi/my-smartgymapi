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
exports.assignTeacher = exports.deleteClass = exports.updateClass = exports.getClassById = exports.getClasses = exports.createClass = void 0;
const class_model_1 = require("../models/class.model");
const schools_schema_1 = __importDefault(require("../models/schools.schema"));
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../utils/pagination");
const users_schema_1 = __importDefault(require("../models/users.schema"));
const section_model_1 = require("../models/section.model");
const generateUniqueCode = () => __awaiter(void 0, void 0, void 0, function* () {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    let isUnique = false;
    while (!isUnique) {
        code = "";
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        const existingClass = yield class_model_1.ClassModel.findOne({ code });
        if (!existingClass) {
            isUnique = true;
        }
    }
    return code;
});
const createClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantId, schoolId, className, 
        // section, // TODO: Handle section separately if needed
        classTeacher, description, medium, shift, isActive } = req.body;
        // Check all required fields
        if (!tenantId || !schoolId || !className) {
            return res.status(400).json({ message: "tenantId, schoolId, and className are required!" });
        }
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(schoolId)) {
            return res.status(400).json({ message: "Invalid schoolId!" });
        }
        // Check if school exists and belongs to the tenant
        const school = yield schools_schema_1.default.findOne({ _id: schoolId, tenantId });
        if (!school) {
            return res.status(404).json({ message: "School not found for this tenant!" });
        }
        // Generate unique code
        const code = yield generateUniqueCode();
        const newClass = yield class_model_1.ClassModel.create({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.createClass = createClass;
const getClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenantId = (0, pagination_1.getQueryParam)(req, 'tenantId');
        const schoolId = (0, pagination_1.getQueryParam)(req, 'schoolId');
        const filter = {};
        if (tenantId)
            filter.tenantId = tenantId;
        if (schoolId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(String(schoolId))) {
                return res.status(400).json({ message: 'Invalid schoolId!' });
            }
            filter.schoolId = schoolId;
        }
        const { page, limit, skip } = (0, pagination_1.getPagination)(req);
        const [classes, totalCount] = yield Promise.all([
            class_model_1.ClassModel.find(filter)
                .populate({
                path: 'classTeacher',
                select: 'account.primaryEmail', // 👈 only fetch email
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(), // 👈 converts to plain JS object (recommended)
            class_model_1.ClassModel.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            message: "Classes fetched successfully",
            data: classes,
            pagination: (0, pagination_1.buildPaginationResponse)(page, limit, totalCount),
        });
    }
    catch (error) {
        console.error('Get Classes Error:', error);
        return res.status(500).json({ message: 'Server Error' });
    }
});
exports.getClasses = getClasses;
const getClassById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid class ID!" });
        }
        const classObj = yield class_model_1.ClassModel.findById(id);
        if (!classObj)
            return res.status(404).json({ message: "Class not found!" });
        return res.status(200).json({ data: classObj });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.getClassById = getClassById;
const updateClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, code, sections } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid class ID!" });
        }
        const classObj = yield class_model_1.ClassModel.findById(id);
        if (!classObj)
            return res.status(404).json({ message: "Class not found!" });
        // Check for duplicate code if updating
        if (code && code !== classObj.code) {
            const existingClass = yield class_model_1.ClassModel.findOne({
                schoolId: classObj.schoolId,
                code,
            });
            if (existingClass) {
                return res
                    .status(409)
                    .json({ message: "Class code already exists in this school." });
            }
        }
        classObj.name = name || classObj.name;
        classObj.code = code || classObj.code;
        if (sections)
            classObj.sections = sections;
        yield classObj.save();
        return res
            .status(200)
            .json({ message: "Class updated successfully", data: classObj });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.updateClass = updateClass;
const deleteClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid class ID!" });
        }
        const classObj = yield class_model_1.ClassModel.findById(id);
        if (!classObj)
            return res.status(404).json({ message: "Class not found!" });
        yield classObj.deleteOne();
        return res.status(200).json({ message: "Class deleted successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.deleteClass = deleteClass;
const assignTeacher = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tenantId, schoolId, classId, teacherId, sectionId } = req.body;
        // 1. Basic validation
        if (!tenantId || !schoolId || !classId || !teacherId) {
            return res.status(400).json({ message: "tenantId, schoolId, classId, and teacherId are required!" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(classId) || !mongoose_1.default.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({ message: "Invalid classId or teacherId!" });
        }
        if (sectionId && !mongoose_1.default.Types.ObjectId.isValid(sectionId)) {
            return res.status(400).json({ message: "Invalid sectionId!" });
        }
        // 2. Verify Teacher
        const teacher = yield users_schema_1.default.findOne({ _id: teacherId, tenantId, userType: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found or is not a teacher for this tenant!" });
        }
        // 3. Verify Class
        const classObj = yield class_model_1.ClassModel.findOne({ _id: classId, tenantId, schoolId });
        if (!classObj) {
            return res.status(404).json({ message: "Class not found for this tenant and school!" });
        }
        // 4. Verify Section (if provided)
        if (sectionId) {
            const sectionExists = (_a = classObj.sections) === null || _a === void 0 ? void 0 : _a.map(id => id.toString()).includes(sectionId);
            if (!sectionExists) {
                return res.status(400).json({ message: "Section does not belong to this class!" });
            }
        }
        // 5. Update Assignment
        classObj.classTeacher = new mongoose_1.default.Types.ObjectId(teacherId);
        yield classObj.save();
        if (sectionId) {
            yield section_model_1.SectionModel.findByIdAndUpdate(sectionId, { homeroomTeacherId: teacherId });
        }
        return res.status(200).json({
            message: "Teacher assigned successfully",
            data: {
                classId,
                teacherId,
                sectionId: sectionId || null
            }
        });
    }
    catch (error) {
        console.error('Assign Teacher Error:', error);
        return res.status(500).json({ message: "Server Error" });
    }
});
exports.assignTeacher = assignTeacher;
