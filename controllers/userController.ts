import { Request, Response } from "express";
import User from "../models/users.schema";
import mongoose from "mongoose";
import bcrypt from "bcrypt";


import School from "../models/schools.schema";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { tenantId, schoolId, userType, profile, account, roles, linkedStudentIds, employment, enrollment } = req.body;

    // 1️⃣ Required fields validation
    if (!tenantId || !schoolId || !userType) {
      return res.status(400).json({ error: "tenantId, schoolId, and userType are required" });
    }

    // 2️⃣ Check if school exists for the tenant
    const schoolExists = await School.findOne({ _id: schoolId, tenantId });
    if (!schoolExists) {
      return res.status(404).json({ error: "School not found for the given tenant" });
    }

    // 3️⃣ Validate userType
    const validUserTypes = ['admin','teacher','student','librarian','guardian'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ error: "Invalid userType" });
    }

    // 4️⃣ Account validation
    if (account) {
      const { email, username, password } = account;
      if (!email && !username) {
        return res.status(400).json({ error: "Either email or username is required in account" });
      }

      // Hash password if provided
      let passwordHash: string | undefined;
      if (password) {
        const saltRounds = 10;
        passwordHash = await bcrypt.hash(password, saltRounds);
      }

      req.body.account = {
        ...account,
        passwordHash
      };
    } else {
      return res.status(400).json({ error: "Account information is required" });
    }

    // 5️⃣ UserType-specific validations
    if (userType === "guardian" && (!linkedStudentIds || !Array.isArray(linkedStudentIds) || linkedStudentIds.length === 0)) {
      return res.status(400).json({ error: "Guardian must have linkedStudentIds" });
    }

    if (['teacher','admin','librarian'].includes(userType) && !employment) {
      return res.status(400).json({ error: `${userType} must have employment details` });
    }

    if (userType === "student" && !enrollment) {
      return res.status(400).json({ error: "Student must have enrollment details" });
    }

    // 6️⃣ Optional: Validate contact info
    if (profile?.contact) {
      const { phone, email } = profile.contact;
      const phoneRegex = /^\+?\d{10,15}$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (phone && !phoneRegex.test(phone)) {
        return res.status(400).json({ error: "Invalid phone format in profile.contact" });
      }
      if (email && !emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format in profile.contact" });
      }
    }

    // 7️⃣ Check for duplicate account (email or username)
    if (account.email) {
      const existingEmail = await User.findOne({ "account.email": account.email });
      if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }
    if (account.username) {
      const existingUsername = await User.findOne({ "account.username": account.username });
      if (existingUsername) {
        return res.status(409).json({ error: "Username already exists" });
      }
    }

    // 8️⃣ Create user
    const user = new User(req.body);
    await user.save();

    res.status(201).json({ message: "User created successfully", user });

  } catch (err: any) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// List all users
export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().populate("roles").populate("linkedStudentIds");
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

    const user = await User.findById(id).populate("roles").populate("linkedStudentIds");
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
