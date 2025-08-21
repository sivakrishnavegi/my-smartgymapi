import bcrypt from "bcrypt";
import { serialize } from "cookie";
import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/users.schema";

import School from "../models/schools.schema";
import { generateToken } from "../utils/genarateToken";

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

    const { primaryEmail: userEmail, username, passwordHash, status } = account;

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
      const existingUser = await User.findOne({ "account.primaryEmail": normalizedEmail });
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


    // Enrollment check for students
    if (userType === "student" && !enrollment) {
      return res.status(400).json({ error: "Student must have enrollment details" });
    }

    const userAccount: any = { username, status: status || "active" };
    if (normalizedEmail) userAccount.primaryEmail = normalizedEmail;
    if (hashedPassword) userAccount.passwordHash = hashedPassword;

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

    console.log("first",userData)

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

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ "account.primaryEmail": email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare password
    if (!user.account || typeof user.account.passwordHash !== "string") {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.account.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token 
    const token = await generateToken({ _id : user?._id as string, email: user.account.primaryEmail!, role: user.userType });

    // Set cookie
    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });
    res.setHeader("Set-Cookie", cookie);

    // Return response
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.account?.primaryEmail ?? null,
        role: user.userType,
        token : token
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
