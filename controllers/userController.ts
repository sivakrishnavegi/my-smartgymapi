import { Request, Response } from "express";
import User from "../models/users.schema";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import School from "../models/schools.schema";

export const createUser = async (req: Request, res: Response) => {

  try {
    const {
      tenantId,
      schoolId,
      userType,
      profile,
      account,
      roles,
      linkedStudentIds,
      employment,
      enrollment,
    } = req.body;

    // Required fields check
    if (!tenantId || !schoolId || !userType) {
      return res
        .status(400)
        .json({ error: "tenantId, schoolId, and userType are required" });
    }

    // Check if school exists
    const schoolExists = await School.findOne({ _id: schoolId, tenantId });
    if (!schoolExists) {
      return res
        .status(404)
        .json({ error: "School not found for the given tenant" });
    }

    // Validate userType
    const validUserTypes = ["admin", "teacher", "student", "librarian", "guardian"];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ error: "Invalid userType" });
    }

    // Account info check
    if (!account) {
      return res.status(400).json({ error: "Account information is required" });
    }

    const { email: userEmail, username, passwordHash, status } = account;

    if (!userEmail && !username) {
      return res
        .status(400)
        .json({ error: "Either email or username is required in account" });
    }

    // Normalize and validate email if provided
    let normalizedEmail: string | undefined;
    if (userEmail) {
      normalizedEmail = userEmail.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail!)) {
        return res.status(400).json({ error: "Invalid email format in account" });
      }

      // Check for duplicate email
      const existingUser = await User.findOne({ "account.email": normalizedEmail });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: `Email already exists: ${normalizedEmail}` });
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (passwordHash) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(passwordHash, saltRounds);
    }

    // Guardian must have linkedStudentIds
    if (
      userType === "guardian" &&
      (!linkedStudentIds || !Array.isArray(linkedStudentIds) || linkedStudentIds.length === 0)
    ) {
      return res.status(400).json({ error: "Guardian must have linkedStudentIds" });
    }

    // Employment check for staff
    if (["teacher", "admin", "librarian"].includes(userType) && !employment) {
      return res
        .status(400)
        .json({ error: `${userType} must have employment details` });
    }

    // Enrollment check for students
    if (userType === "student" && !enrollment) {
      return res.status(400).json({ error: "Student must have enrollment details" });
    }

    // Build account object safely
    const userAccount: any = { username, status: status || "active" };
    if (normalizedEmail) userAccount.email = normalizedEmail;
    if (hashedPassword) userAccount.passwordHash = hashedPassword;

    // Construct user object
    const userData = {
      tenantId,
      schoolId,
      userType,
      profile: profile || {},
      roles: roles || [],
      linkedStudentIds: linkedStudentIds || [],
      employment: employment || {},
      enrollment: enrollment || {},
      account: userAccount,
    };

    // Save user
    const user = new User(userData);
    await user.save();

    res.status(201).json({ message: "User created successfully", user });
  } catch (err: any) {
    

    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];
      const duplicateValue = err.keyValue?.[duplicateField];
      return res.status(400).json({
        error: `Duplicate value for ${duplicateField}: ${duplicateValue}`,
      });
    }

    console.error("Create user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};



// List all users
export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .populate("roles")
      .populate("linkedStudentIds");
    res.status(200).json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });

    const user = await User.findById(id)
      .populate("roles")
      .populate("linkedStudentIds");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });

    const user = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User updated", user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
