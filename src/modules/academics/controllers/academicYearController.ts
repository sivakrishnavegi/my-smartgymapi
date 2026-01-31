import { Request, Response } from "express";
import AcademicYear, { IAcademicYear } from "@academics/models/academicYear.schema";
import { logError } from '@shared/utils/errorLogger';

// Create Academic Year
export const createAcademicYear = async (req: Request, res: Response) => {
  try {
    const { title, startDate, endDate, isActive } = req.body;

    // Check for duplicate title
    const existingTitle = await AcademicYear.findOne({ title: title.trim() });
    if (existingTitle) {
      return res.status(409).json({ message: `Academic Year with title "${title}" already exists.` });
    }

    // Check for overlapping year range
    const overlappingYear = await AcademicYear.findOne({
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
      ],
    });

    if (overlappingYear) {
      return res.status(409).json({ message: `Academic Year overlaps with existing year "${overlappingYear.title}".` });
    }

    const academicYear = new AcademicYear({
      title: title.trim(),
      startDate,
      endDate,
      isActive,
    });

    const saved = await academicYear.save();
    res.status(201).json(saved);
  } catch (error: any) {
    console.error(error);
    await logError(req, error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get All Academic Years
export const getAllAcademicYears = async (req: Request, res: Response) => {
  try {
    const years = await AcademicYear.find().sort({ startDate: -1 });
    res.json(years);
  } catch (error: any) {
    await logError(req as Request, error);
    res.status(500).json({ message: error.message });
  }
};

// Get Single Academic Year
export const getAcademicYear = async (req: Request, res: Response) => {
  try {
    const year = await AcademicYear.findById(req.params.id);
    if (!year) return res.status(404).json({ message: "Academic Year not found" });
    res.json(year);
  } catch (error: any) {
    await logError(req, error);
    res.status(500).json({ message: error.message });
  }
};

// Update Academic Year
export const updateAcademicYear = async (req: Request, res: Response) => {
  try {
    const updated = await AcademicYear.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Academic Year not found" });
    res.json(updated);
  } catch (error: any) {
    await logError(req, error);
    res.status(400).json({ message: error.message });
  }
};

// Delete Academic Year
export const deleteAcademicYear = async (req: Request, res: Response) => {
  try {
    const deleted = await AcademicYear.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Academic Year not found" });
    res.json({ message: "Academic Year deleted successfully" });
  } catch (error: any) {
    await logError(req, error);
    res.status(500).json({ message: error.message });
  }
};
