// controllers/user.controller.ts
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { RoleModel } from "../../models/roles.schema";
import UserModel, { IUser } from "../../models/users.schema";

// ------------------ Type for Payload ------------------
export interface AddUserPayload {
  tenantId: string;
  schoolId: string;
  userType: IUser["userType"];
  profile: {
    firstName: string;
    lastName: string;
    dob: string;
    gender: "male" | "female" | "other";
    photoUrl?: string;
    address?: string;
    contact: {
      email: string;
      phone: string;
    };
  };
  account: {
    primaryEmail: string;
    username: string;
    passwordHash: string;
    status?: any;
  };
  roles?: string[];
  linkedStudentIds?: string[];
  employment?: {
    staffId: string;
    deptId: string;
    hireDate?: string;
  };
  enrollment?: {
    studentId?: string;
    classId?: string;
    sectionId?: string;
    regNo?: string;
  };
  createdAt: string;
}

// ------------------ Add User Controller ------------------
export const addUser = async (req: Request, res: Response) => {
  try {
    const payload: AddUserPayload = req.body;

    // -------- Validation --------
    if (!payload.tenantId || !payload.schoolId)
      return res
        .status(400)
        .json({ message: "tenantId and schoolId are required" });

    if (!payload.userType)
      return res.status(400).json({ message: "userType is required" });

    const { firstName, lastName, contact } = payload.profile;
    if (!firstName || !lastName)
      return res
        .status(400)
        .json({ message: "Profile firstName and lastName are required" });

    if (!contact?.email || !contact?.phone)
      return res
        .status(400)
        .json({ message: "Contact email and phone are required" });

    // -------- Unique Check --------
    const existingUserByEmail = await UserModel.findOne({
      "account.primaryEmail": payload.account.primaryEmail.toLowerCase(),
    });

    if (existingUserByEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const existingUserByUsername = await UserModel.findOne({
      "account.username": payload.account.username,
    });

    if (existingUserByUsername) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const role = await RoleModel.findOne({ name: payload.userType });

    if (!role) {
      return res
        .status(400)
        .json({ message: `Role '${payload.userType}' does not exist` });
    }

    const roleId: mongoose.Types.ObjectId = role._id as mongoose.Types.ObjectId;

    // ---------------- Hash Password ----------------
    const hashedPassword = await bcrypt.hash(payload.account.passwordHash, 10);

    // -------- Build User Document --------
    const newUser: Partial<IUser> = {
      tenantId: payload.tenantId,
      schoolId: mongoose.Types.ObjectId.isValid(payload.schoolId)
        ? new mongoose.Types.ObjectId(payload.schoolId)
        : undefined, // validate schoolId
      userType: payload.userType,
      profile: {
        firstName,
        lastName,
        dob: new Date(payload.profile.dob),
        gender: payload.profile.gender,
        photoUrl: payload.profile.photoUrl,
        address: payload.profile.address,
        contact: {
          secondaryEmail: contact.email.toLowerCase(),
          secondaryContact: contact.phone,
        },
      },
      account: {
        primaryEmail: payload.account.primaryEmail.toLowerCase(),
        username: payload.account.username,
        passwordHash: hashedPassword,
        status: payload?.account?.status || "inactive",
      },
      createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(), // ✅ Date object
      createdBy:
        req.user! && mongoose.Types.ObjectId.isValid(req.user.id!)
          ? new mongoose.Types.ObjectId(req.user.id!)
          : undefined,
      providers: [{ provider: "local" }],
      roles: [roleId],
    };

    // -------- Save User --------
    const userDoc = new UserModel(newUser);
    await userDoc.save();

    return res.status(201).json({
      message: "User created successfully",
      user: userDoc,
    });
  } catch (error: any) {
    console.error("❌ Error creating user:", error);
    const message = error?.message || "Failed to create user";
    return res.status(500).json({ message });
  }
};



// ------------------ Get All Users ------------------
export const getAllUsers = async (req: Request, res: Response) => {
    try {
    // -------- Pagination --------
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // -------- Filters --------
    const filters: any = {};
    if (req.query.userType) filters.userType = req.query.userType.toString().toLowerCase();
    if (req.query.status) filters["account.status"] = req.query.status;

    // Optional search by name or email
    if (req.query.search) {
      const search = req.query.search.toString();
      filters.$or = [
        { "profile.firstName": { $regex: search, $options: "i" } },
        { "profile.lastName": { $regex: search, $options: "i" } },
        { "account.primaryEmail": { $regex: search, $options: "i" } },
        { "account.username": { $regex: search, $options: "i" } },
      ];
    }

    // -------- Sorting --------
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;

    // -------- Query Users --------
    const [users, total] = await Promise.all([
      UserModel.find(filters)
        .sort({ [sortBy]: order })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filters),
    ]);

    return res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching users:", error);
    return res.status(500).json({ message: error?.message || "Failed to fetch users" });
  }
};

