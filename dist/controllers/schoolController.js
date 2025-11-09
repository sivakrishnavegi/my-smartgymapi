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
exports.deleteSchool = exports.updateSchool = exports.getSchoolById = exports.listSchools = exports.createSchool = void 0;
const schools_schema_1 = __importDefault(require("../models/schools.schema"));
const tenant_schema_1 = __importDefault(require("../models/tenant.schema"));
/**
 * @swagger
 * tags:
 *   name: Schools
 *   description: School management APIs
 */
/**
 * @swagger
 * /schools:
 *   post:
 *     summary: Create a new school
 *     tags: [Schools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/School'
 *     responses:
 *       201:
 *         description: School created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/School'
 *       400:
 *         description: Invalid request
 */
const createSchool = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantId, name, address, contact, academicYears, settings } = req.body;
        if (!tenantId || !name || !address) {
            console.warn("[CreateSchool] Missing required fields", req.body);
            return res.status(400).json({ error: "tenantId, name, and address are required" });
        }
        const tenantExists = yield tenant_schema_1.default.findOne({ tenantId });
        if (!tenantExists) {
            console.warn(`[CreateSchool] Tenant not found: ${tenantId}`);
            return res.status(404).json({ error: "Tenant not found" });
        }
        if (contact) {
            const { phone, email } = contact;
            const phoneRegex = /^\+?\d{10,15}$/;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (phone && !phoneRegex.test(phone)) {
                return res.status(400).json({ error: "Invalid phone number format" });
            }
            if (email && !emailRegex.test(email)) {
                return res.status(400).json({ error: "Invalid email format" });
            }
        }
        const existingSchool = yield schools_schema_1.default.findOne({ tenantId });
        if (existingSchool) {
            console.warn(`[CreateSchool] Duplicate school name for tenant ${tenantId}: ${name}`);
            return res.status(409).json({ error: "A school with this name already exists for this tenant" });
        }
        if (academicYears && !Array.isArray(academicYears)) {
            return res.status(400).json({ error: "academicYears must be an array" });
        }
        const school = new schools_schema_1.default({
            tenantId,
            name,
            address,
            contact: contact || {},
            academicYears: academicYears || [],
            settings: settings || {},
            createdAt: new Date(),
        });
        yield school.save();
        console.log(`[CreateSchool] School created successfully: ${school._id} for tenant ${tenantId}`);
        return res.status(201).json({ message: "School created successfully", school });
    }
    catch (err) {
        console.error("[CreateSchool] Error creating school:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.createSchool = createSchool;
/**
 * @swagger
 * /schools:
 *   get:
 *     summary: Get list of all schools
 *     tags: [Schools]
 *     responses:
 *       200:
 *         description: List of schools
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/School'
 */
const listSchools = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schools = yield schools_schema_1.default.find();
        res.status(200).json(schools);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.listSchools = listSchools;
/**
 * @swagger
 * /schools/{id}:
 *   get:
 *     summary: Get school by ID
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: School ID
 *     responses:
 *       200:
 *         description: School details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/School'
 *       404:
 *         description: School not found
 */
const getSchoolById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const school = yield schools_schema_1.default.findById(req.params.id);
        if (!school)
            return res.status(404).json({ error: "School not found" });
        res.status(200).json(school);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.getSchoolById = getSchoolById;
/**
 * @swagger
 * /schools/{id}:
 *   put:
 *     summary: Update a school by ID
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: School ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/School'
 *     responses:
 *       200:
 *         description: School updated successfully
 *       404:
 *         description: School not found
 */
const updateSchool = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const school = yield schools_schema_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!school)
            return res.status(404).json({ error: "School not found" });
        res.status(200).json({ message: "School updated", school });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.updateSchool = updateSchool;
/**
 * @swagger
 * /schools/{id}:
 *   delete:
 *     summary: Delete a school by ID
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: School ID
 *     responses:
 *       200:
 *         description: School deleted successfully
 *       404:
 *         description: School not found
 */
const deleteSchool = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const school = yield schools_schema_1.default.findByIdAndDelete(req.params.id);
        if (!school)
            return res.status(404).json({ error: "School not found" });
        res.status(200).json({ message: "School deleted" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.deleteSchool = deleteSchool;
