import { Request, Response } from "express";
import School from "../models/schools.schema";
import Tenant from "../models/tenant.schema";

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
export const createSchool = async (req: Request, res: Response) => {
  try {
    const { tenantId, name, address, contact, academicYears } = req.body;

    // 1️⃣ Basic field validation
    if (!tenantId || !name || !address) {
      return res.status(400).json({ error: "tenantId, name, and address are required" });
    }

    // 2️⃣ Check if tenant exists
    const tenantExists = await Tenant.findOne({ tenantId });
    if (!tenantExists) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // 3️⃣ Optional: Validate contact format if provided
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

    // 4️⃣ Check for duplicate school by tenantId + name
    const existingSchool = await School.findOne({ tenantId, name });
    if (existingSchool) {
      return res.status(409).json({ error: "A school with this name already exists for the tenant" });
    }

    // 5️⃣ Optional: Validate academicYears if provided
    if (academicYears && !Array.isArray(academicYears)) {
      return res.status(400).json({ error: "academicYears must be an array" });
    }

    // 6️⃣ Create and save school
    const school = new School(req.body);
    await school.save();

    res.status(201).json({ message: "School created successfully", school });
  } catch (err: any) {
    console.error("Error creating school:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

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
export const listSchools = async (req: Request, res: Response) => {
  try {
    const schools = await School.find();
    res.status(200).json(schools);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

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
export const getSchoolById = async (req: Request, res: Response) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ error: "School not found" });
    res.status(200).json(school);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

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
export const updateSchool = async (req: Request, res: Response) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!school) return res.status(404).json({ error: "School not found" });
    res.status(200).json({ message: "School updated", school });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

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
export const deleteSchool = async (req: Request, res: Response) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) return res.status(404).json({ error: "School not found" });
    res.status(200).json({ message: "School deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
