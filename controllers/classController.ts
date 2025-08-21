import { Request, Response } from "express";
import { ClassModel } from "../models/class.model";
import  SchoolModel  from "../models/schools.schema"; 
import mongoose from "mongoose";


export const createClass = async (req: Request, res: Response) => {
  try {
    const { tenantId, schoolId, name, code } = req.body;

    // Check all required fields
    if (!tenantId || !schoolId || !name || !code) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({ message: "Invalid schoolId!" });
    }

    // Check if school exists and belongs to the tenant
    const school = await SchoolModel.findOne({ _id: schoolId, tenantId });
    if (!school) {
      return res.status(404).json({ message: "School not found for this tenant!" });
    }

    // Check for duplicate class code within the same school
    const existingClass = await ClassModel.findOne({ schoolId, code });
    if (existingClass) {
      return res.status(409).json({ message: "Class code already exists in this school." });
    }

    const newClass = await ClassModel.create({ tenantId, schoolId, name, code });
    return res.status(201).json({ message: "Class created successfully", data: newClass });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const getClasses = async (req: Request, res: Response) => {
  try {
    const { tenantId, schoolId } = req.query;

    const filter: any = {};
    if (tenantId) filter.tenantId = tenantId;
    if (schoolId) {
      if (!mongoose.Types.ObjectId.isValid(String(schoolId))) {
        return res.status(400).json({ message: "Invalid schoolId!" });
      }
      filter.schoolId = schoolId;
    }

    const classes = await ClassModel.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ data: classes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class ID!" });
    }

    const classObj = await ClassModel.findById(id);
    if (!classObj) return res.status(404).json({ message: "Class not found!" });

    return res.status(200).json({ data: classObj });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class ID!" });
    }

    const classObj = await ClassModel.findById(id);
    if (!classObj) return res.status(404).json({ message: "Class not found!" });

    // Check for duplicate code if updating
    if (code && code !== classObj.code) {
      const existingClass = await ClassModel.findOne({ schoolId: classObj.schoolId, code });
      if (existingClass) {
        return res.status(409).json({ message: "Class code already exists in this school." });
      }
    }

    classObj.name = name || classObj.name;
    classObj.code = code || classObj.code;

    await classObj.save();
    return res.status(200).json({ message: "Class updated successfully", data: classObj });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class ID!" });
    }

    const classObj = await ClassModel.findById(id);
    if (!classObj) return res.status(404).json({ message: "Class not found!" });

    await classObj.deleteOne();
    return res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
