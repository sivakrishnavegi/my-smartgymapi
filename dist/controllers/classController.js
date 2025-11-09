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
exports.deleteClass = exports.updateClass = exports.getClassById = exports.getClasses = exports.createClass = void 0;
const class_model_1 = require("../models/class.model");
const schools_schema_1 = __importDefault(require("../models/schools.schema"));
const mongoose_1 = __importDefault(require("mongoose"));
const createClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantId, schoolId, name, code } = req.body;
        // Check all required fields
        if (!tenantId || !schoolId || !name || !code) {
            return res.status(400).json({ message: "All fields are required!" });
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
        // Check for duplicate class code within the same school
        const existingClass = yield class_model_1.ClassModel.findOne({ schoolId, code });
        if (existingClass) {
            return res.status(409).json({ message: "Class code already exists in this school." });
        }
        const newClass = yield class_model_1.ClassModel.create({ tenantId, schoolId, name, code });
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
        const { tenantId, schoolId } = req.query;
        const filter = {};
        if (tenantId)
            filter.tenantId = tenantId;
        if (schoolId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(String(schoolId))) {
                return res.status(400).json({ message: "Invalid schoolId!" });
            }
            filter.schoolId = schoolId;
        }
        const classes = yield class_model_1.ClassModel.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ data: classes });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
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
        const { name, code } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid class ID!" });
        }
        const classObj = yield class_model_1.ClassModel.findById(id);
        if (!classObj)
            return res.status(404).json({ message: "Class not found!" });
        // Check for duplicate code if updating
        if (code && code !== classObj.code) {
            const existingClass = yield class_model_1.ClassModel.findOne({ schoolId: classObj.schoolId, code });
            if (existingClass) {
                return res.status(409).json({ message: "Class code already exists in this school." });
            }
        }
        classObj.name = name || classObj.name;
        classObj.code = code || classObj.code;
        yield classObj.save();
        return res.status(200).json({ message: "Class updated successfully", data: classObj });
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
