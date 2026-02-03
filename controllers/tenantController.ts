import crypto from "crypto";
import { Request, Response } from "express";
import { parseApiKey } from "../helpers/keys";
import School from "@academics/models/schools.schema";
import Tenant from "@academics/models/tenant.schema";
import { logError } from '../utils/errorLogger';
import { z } from "zod";

export const schoolConfigSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.string().length(0)),
  affiliationNumber: z.string().min(1, "Affiliation number is required"),
  website: z.string().url("Invalid website URL").optional().or(z.string().length(0)),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(1, "Pincode is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  email: z.string().email("Invalid email address"),
  adminName: z.string().min(1, "Admin name is required"),
  adminDesignation: z.string().min(1, "Admin designation is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  timezone: z.string().min(1, "Timezone is required"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
  agreedToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

export const createTenant = async (req: Request, res: Response) => {
  try {
    const { name, domain, plan, subscription } = req.body;

    // Check if tenant with same domain already exists
    const existingTenant = await Tenant.findOne({ domain });
    if (existingTenant) {
      return res
        .status(400)
        .json({ error: "Tenant with this domain already exists" });
    }

    const tenant = new Tenant({
      name,
      domain,
      plan,
      subscription,
    });

    await tenant.save();
    res.status(201).json({
      message: "Tenant created successfully",
      tenant,
    });
  } catch (err: any) {
    await logError(req, err);
    res.status(400).json({ error: err.message });
  }
};

//  Get all tenants
export const listTenants = async (_req: Request, res: Response) => {
  try {
    const tenants = await Tenant.find({}, { apiKeys: 0 }).lean();
    res.status(200).json({
      success: true,
      message: "Tenants fetched successfully",
      tenants,
    });
  } catch (err: any) {
    await logError(_req, err);
    res.status(500).json({ error: err.message });
  }
};

//  Get tenant by ID
export const getTenantById = async (req: Request, res: Response) => {
  console.log("first get by id");

  try {
    const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json(tenant);
  } catch (err: any) {
    await logError(req, err);
    res.status(500).json({ error: err.message });
  }
};

//  Get tenant by DomainName
export const getTenantByDomainId = async (req: Request, res: Response) => {
  try {
    // Use path parameter
    const { domainId } = await req?.params;

    const tenant = await Tenant.findOne({ domain: domainId });

    if (!tenant) {
      return res.status(404).json({ status: 404, error: "Tenant not found" });
    }
    // Find school(s) associated with this tenant
    const school = await School.findOne({ tenantId: tenant?.tenantId });
    const schoolId = school && school?._id?.toString();
    await res.json({
      tenant,
      schoolId,
    });
  } catch (err: any) {
    console.error("Error fetching tenant by domain:", err);
    await logError(req, err);
    res.status(500).json({ error: err.message });
  }
};

//  Update tenant info
export const updateTenant = async (req: Request, res: Response) => {
  try {
    const updated = await Tenant.findOneAndUpdate(
      { tenantId: req.params.tenantId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Tenant not found" });
    res.json(updated);
  } catch (err: any) {
    await logError(req, err);
    res.status(400).json({ error: err.message });
  }
};

//  Delete tenant
export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const deleted = await Tenant.findOneAndDelete({
      tenantId: req.params.tenantId,
    });
    if (!deleted) return res.status(404).json({ error: "Tenant not found" });
    res.json({ message: "Tenant deleted successfully" });
  } catch (err: any) {
    await logError(req, err);
    res.status(500).json({ error: err.message });
  }
};

export const issueApiKey = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    //@ts-ignore
    const userId! = req.user?.id;

    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    // 1. Generate unique key parts
    const keyId = crypto.randomBytes(8).toString("hex"); // shorter prefix
    const keySecret = crypto.randomBytes(32).toString("hex");

    // 2. Build final API key (exposed to client only once)
    //    Example format: sk_live_<id>_<secret>
    const rawApiKey = `sk_live_${keyId}_${keySecret}`;

    // 3. Hash secret for storage (never store raw key!)
    const keyHash = crypto.createHash("sha256").update(keySecret).digest("hex");

    // 4. Save in DB
    tenant.apiKeys.push({
      keyHash,
      keySecret: keyId,
      issuedAt: new Date(),
      issuedBy: userId!,
      revoked: false,
    });

    await tenant.save();

    // 5. Return full key once
    res.status(201).json({
      apiKey: rawApiKey,
      message:
        "API key issued successfully. Store it securely, it won't be shown again.",
    });
  } catch (err: any) {
    console.error("Error issuing API key:", err);
    await logError(req, err);
    res.status(500).json({ error: "Failed to issue API key" });
  }
};

export const verifyApiKey = async (req: Request, res: Response) => {
  try {
    const { apiKey, tenantId } = req.body;

    if (!apiKey || !tenantId) {
      return res
        .status(400)
        .json({ error: "apiKey and tenantId are required in body" });
    }

    const parsed = parseApiKey(apiKey);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid API key format" });
    }

    const { keyId, secret } = parsed;

    // 1. Find tenant and validate against tenantId
    const tenant = await Tenant.findOne({
      tenantId,
      "apiKeys.keySecret": keyId,
    });

    if (!tenant) {
      return res.status(404).json({ error: "Tenant or API key not found" });
    }

    const apiKeyEntry = tenant.apiKeys.find((k) => k.keySecret === keyId);
    if (!apiKeyEntry || apiKeyEntry.revoked) {
      return res.status(403).json({ error: "API key revoked or invalid" });
    }

    const secretHash = crypto.createHash("sha256").update(secret).digest("hex");
    if (secretHash !== apiKeyEntry.keyHash) {
      return res.status(403).json({ error: "Invalid API key secret" });
    }

    await Tenant.findOneAndUpdate(
      { tenantId },
      { isApiKeysVerified: true },
      { upsert: true, new: true }
    );

    // 5. Success → attach tenant info
    (req as any).tenant = tenant;

    return res.status(200).json({
      valid: true,
      tenantId: tenant.tenantId,
      issuedBy: apiKeyEntry.issuedBy,
      issuedAt: apiKeyEntry.issuedAt,
    });
  } catch (err: any) {
    console.error("Error verifying API key:", err);
    await logError(req, err);
    res.status(500).json({ error: "Internal server error" });
  }
};

//  Revoke API Key
export const revokeApiKey = async (req: Request, res: Response) => {
  try {
    const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const apiKey = tenant.apiKeys.find((k) => k.keyHash === req.params.keyHash);
    if (!apiKey) return res.status(404).json({ error: "API Key not found" });

    apiKey.revoked = true;
    await tenant.save();

    res.json({ message: "API Key revoked" });
  } catch (err: any) {
    await logError(req, err);
    res.status(500).json({ error: err.message });
  }
};

// Update subscription plan
export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, maxUsers, maxStudents, plan } =
      req.body;

    const tenant = await Tenant.findOneAndUpdate(
      { tenantId: req.params.tenantId },
      {
        subscription: { startDate, endDate, status, maxUsers, maxStudents },
        plan,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    res.json(tenant);
  } catch (err: any) {
    await logError(req, err);
    res.status(400).json({ error: err.message });
  }
};

export const configureSchool = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers["x-tenant-id"] as string;
    const schoolId = req.headers["x-school-id"] as string;
    const tenantDomain = req.headers["x-tenant-domain"] as string;
    const apiKey = req.headers["x-api-key"] as string;

    // 1. Fail-safe checks for headers
    if (!tenantId || !schoolId || !apiKey) {
      return res.status(400).json({
        success: false,
        message: "Missing Required Headers: x-tenant-id, x-school-id, and x-api-key are mandatory"
      });
    }

    // 2. Validate Tenant Exists & matches domain (if provided)
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Invalid Tenant ID: Tenant not found"
      });
    }

    if (tenantDomain && tenant.domain !== tenantDomain) {
      return res.status(400).json({
        success: false,
        message: "Domain Mismatch: x-tenant-domain does not match the registered tenant domain"
      });
    }

    // Data is already validated by middleware if used, but we handle it here for direct calls
    const configData = req.body;

    // 3. Update School Configuration
    const updatedSchool = await School.findOneAndUpdate(
      { _id: schoolId, tenantId },
      {
        ...configData,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedSchool) {
      return res.status(404).json({
        success: false,
        message: "School not found or does not belong to this tenant"
      });
    }

    // 4. Update tenant setup status (Both flags as requested)
    await Tenant.findOneAndUpdate(
      { tenantId },
      {
        isSchoolSetupCompleted: true,
        isSassSetupCompleted: true, // Mark SASS setup as complete
        updatedAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: "School configuration updated successfully",
      data: updatedSchool
    });
  } catch (error: any) {
    console.error("[CONFIGURE SCHOOL ERROR]", error);
    await logError(req, error);
    res.status(500).json({
      success: false,
      message: "Internal server error during school configuration",
      error: error.message
    });
  }
};
