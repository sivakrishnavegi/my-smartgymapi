import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { RoleModel } from "../../models/roles.schema";
import School from "../../models/schools.schema";
import UserModel from "../../models/users.schema";

export const addNewStaffMemberToSchool = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      tenantId,
      schoolId,
      profile,
      role, // "teacher"
      department,
      staffType,
      account,
    } = req.body;

    // -----------------------------------------
    // 1. Validate required fields
    // -----------------------------------------
    if (!tenantId || !schoolId) {
      return res
        .status(400)
        .json({ error: "tenantId and schoolId are required" });
    }

    if (!role) {
      return res
        .status(400)
        .json({ error: "Staff role is required (ex: teacher)" });
    }

    if (!account) {
      return res.status(400).json({ error: "Account information is required" });
    }

    const { username, password, isActive, permissions, email } = account;

    if (!email)
      return res.status(400).json({ error: "Account email is required" });
    if (!password)
      return res.status(400).json({ error: "Account password is required" });

    // -----------------------------------------
    // 2. Validate school exists
    // -----------------------------------------
    const schoolObjectId = new Types.ObjectId(schoolId);
    const schoolExists = await School.findOne({
      _id: schoolObjectId,
      tenantId,
    });
    if (!schoolExists)
      return res
        .status(404)
        .json({ error: "School not found for the given tenant" });

    // -----------------------------------------
    // 3. Validate email format and uniqueness
    // -----------------------------------------
    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail))
      return res.status(400).json({ error: "Invalid email format" });

    const existingUser = await UserModel.findOne({
      "account.primaryEmail": normalizedEmail,
    });
    if (existingUser)
      return res
        .status(400)
        .json({ error: `Email already exists: ${normalizedEmail}` });

    // -----------------------------------------
    // 4. Validate password strength (multi-step)
    // -----------------------------------------
    const passwordErrors = [];
    if (password.length < 8)
      passwordErrors.push("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password))
      passwordErrors.push(
        "Password must contain at least one uppercase letter"
      );
    if (!/[a-z]/.test(password))
      passwordErrors.push(
        "Password must contain at least one lowercase letter"
      );
    if (!/[0-9]/.test(password))
      passwordErrors.push("Password must contain at least one digit");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      passwordErrors.push(
        "Password must contain at least one special character"
      );

    if (passwordErrors.length)
      return res.status(400).json({ error: passwordErrors });

    const hashedPassword = await bcrypt.hash(password, 12); // stronger hash

    // -----------------------------------------
    // 5. Lookup role by name for this school & tenant
    // -----------------------------------------
    const roleDoc = await RoleModel.findOne({
      tenantId,
      schoolId: schoolObjectId,
      name: role,
    });
    if (!roleDoc)
      return res
        .status(400)
        .json({ error: `Role '${role}' not found for this school` });

    // -----------------------------------------
    // 6. Construct account object
    // -----------------------------------------
    const userAccount = {
      primaryEmail: normalizedEmail,
      username: username || normalizedEmail,
      passwordHash: hashedPassword,
      status: isActive ? "active" : "inactive",
      permissions: permissions?.length ? permissions : roleDoc.permissions,
    };

    // -----------------------------------------
    // 7. Build staff document
    // -----------------------------------------
    const userData = {
      tenantId,
      schoolId: schoolObjectId,
      userType: roleDoc.name,
      profile: {
        fullName: profile?.fullName,
        email: normalizedEmail,
        phone: profile?.phone,
        gender: profile?.gender,
        dob: profile?.dob,
      },
      roles: [roleDoc._id], // store ObjectId
      employment: { department, staffType },
      account: userAccount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // -----------------------------------------
    // 8. Save staff to DB
    // -----------------------------------------
    const user = new UserModel(userData);
    await user.save();

    res.status(201).json({
      message: "Staff member added successfully",
      user,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];
      const duplicateValue = err.keyValue?.[duplicateField];
      return res.status(400).json({
        error: `Duplicate value for ${duplicateField}: ${duplicateValue}`,
      });
    }

    console.error("Add staff error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
