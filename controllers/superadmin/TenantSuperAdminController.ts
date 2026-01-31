import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Tenant from "@academics/models/tenant.schema";
import School from "@academics/models/schools.schema";
import User from "@iam/models/users.schema";
import { logError } from '../../utils/errorLogger';


const JWT_SECRET = process.env.JWT_SECRET_KEY || "your_secret_key";

// ------------------ Create SuperAdmin ------------------
export const createSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { tenantId, schoolId, email: userEmail, password, firstName, lastName } = req.body;

    // Normalize and validate email if provided
    let normalizedEmail: string | undefined;
    if (userEmail) {
      normalizedEmail = userEmail.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail!)) {
        return res.status(400).json({ error: "Invalid email format in account" });
      }
    }

    if (!tenantId || !userEmail || !password) {
      return res.status(400).json({ error: "tenantId, email, and password are required" });
    }

    // Validate tenant exists
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    // Optional: validate schoolId exists and belongs to tenant
    if (schoolId) {
      const school = await School.findOne({ _id: schoolId, tenantId });
      if (!school) return res.status(404).json({ error: "School not found for this tenant" });
    }

    // Check if superadmin already exists for this tenant
    const existingSuperAdmin = await User.findOne({ tenantId, userType: "superadmin" });
    if (existingSuperAdmin) {
      return res.status(409).json({ error: "SuperAdmin already exists for this tenant" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create superadmin user
    const superAdmin = new User({
      tenantId,
      schoolId: schoolId,
      userType: "superadmin",
      profile: { firstName, lastName },
      account: { primaryEmail: normalizedEmail, passwordHash: hashedPassword, status: "inactive" },
      providers: [{ provider: "local" }],
    });

    await superAdmin.save();

    res.status(201).json({ message: "SuperAdmin created successfully", superAdminId: superAdmin._id });
  } catch (err: any) {
    console.error("Create SuperAdmin Error:", err);
    await logError(req, err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ------------------ SuperAdmin Login ------------------
export const superAdminLogin = async (req: Request, res: Response) => {
  try {
    const { tenantId, email, password } = req.body;

    if (!tenantId || !email || !password) {
      return res.status(400).json({ error: "tenantId, email, and password are required" });
    }

    // Find superadmin
    const superAdmin = await User.findOne({ tenantId, userType: "superadmin", "account.primaryEmail": email });
    if (!superAdmin) return res.status(404).json({ error: "SuperAdmin not found" });

    // Validate password
    const isMatch = await bcrypt.compare(password, superAdmin.account?.passwordHash || "");
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { userId: superAdmin._id, tenantId: superAdmin.tenantId, role: "superadmin" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful", token, superAdminId: superAdmin._id });
  } catch (err: any) {
    console.error("SuperAdmin Login Error:", err);
    await logError(req, err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ------------------ Get SuperAdmin Info ------------------
export const getSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) return res.status(400).json({ error: "tenantId is required" });

    const superAdmin = await User.findOne({ tenantId, userType: "superadmin" }).select("-account.passwordHash");
    if (!superAdmin) return res.status(404).json({ error: "SuperAdmin not found" });

    res.status(200).json({ superAdmin });
  } catch (err: any) {
    console.error("Get SuperAdmin Error:", err);
    await logError(req, err);
    res.status(500).json({ error: "Internal server error" });
  }
};
