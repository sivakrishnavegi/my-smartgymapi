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
exports.deleteAcademicYear = exports.updateAcademicYear = exports.getAcademicYear = exports.getAllAcademicYears = exports.createAcademicYear = void 0;
const academicYear_schema_1 = __importDefault(require("../models/academicYear.schema"));
// Create Academic Year
const createAcademicYear = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, startDate, endDate, isActive } = req.body;
        // Check for duplicate title
        const existingTitle = yield academicYear_schema_1.default.findOne({ title: title.trim() });
        if (existingTitle) {
            return res.status(409).json({ message: `Academic Year with title "${title}" already exists.` });
        }
        // Check for overlapping year range
        const overlappingYear = yield academicYear_schema_1.default.findOne({
            $or: [
                { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
            ],
        });
        if (overlappingYear) {
            return res.status(409).json({ message: `Academic Year overlaps with existing year "${overlappingYear.title}".` });
        }
        const academicYear = new academicYear_schema_1.default({
            title: title.trim(),
            startDate,
            endDate,
            isActive,
        });
        const saved = yield academicYear.save();
        res.status(201).json(saved);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});
exports.createAcademicYear = createAcademicYear;
// Get All Academic Years
const getAllAcademicYears = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const years = yield academicYear_schema_1.default.find().sort({ startDate: -1 });
        res.json(years);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAllAcademicYears = getAllAcademicYears;
// Get Single Academic Year
const getAcademicYear = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const year = yield academicYear_schema_1.default.findById(req.params.id);
        if (!year)
            return res.status(404).json({ message: "Academic Year not found" });
        res.json(year);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAcademicYear = getAcademicYear;
// Update Academic Year
const updateAcademicYear = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updated = yield academicYear_schema_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated)
            return res.status(404).json({ message: "Academic Year not found" });
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updateAcademicYear = updateAcademicYear;
// Delete Academic Year
const deleteAcademicYear = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield academicYear_schema_1.default.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ message: "Academic Year not found" });
        res.json({ message: "Academic Year deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteAcademicYear = deleteAcademicYear;
