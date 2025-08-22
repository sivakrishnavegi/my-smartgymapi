import crypto from "crypto";
import { Request, Response } from "express";
import Tenant from "../models/tenant.schema";

export const createTenant = async (req: Request, res: Response) => {
  try {
    const { name, domain, plan, subscription } = req.body;

    // Check if tenant with same domain already exists
    const existingTenant = await Tenant.findOne({ domain });
    if (existingTenant) {
      return res.status(400).json({ error: "Tenant with this domain already exists" });
    }

    const tenant = new Tenant({
      name,
      domain,
      plan,
      subscription,
    });

    await tenant.save();
    res.status(201).json(tenant);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};


// 📌 Get all tenants
export const listTenants = async (_req: Request, res: Response) => {
  try {
    const tenants = await Tenant.find();
    res.json(tenants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get tenant by ID
export const getTenantById = async (req: Request, res: Response) => {
      console.log("first get by id")

  try {
    const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.json(tenant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get tenant by DomainName
export const getTenantByDomainId = async (req: Request, res: Response) => {
  try {
    // Use path parameter
    const { domainId } = await req?.params;

    const tenant = await Tenant.findOne({ domain: domainId });

    if (!tenant) {
      return res.status(404).json({ status: 404, error: "Tenant not found" });
    }

    res.json({ tenant });
  } catch (err: any) {
    console.error("Error fetching tenant by domain:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✏️ Update tenant info
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
    res.status(400).json({ error: err.message });
  }
};

// 🗑️ Delete tenant
export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const deleted = await Tenant.findOneAndDelete({ tenantId: req.params.tenantId });
    if (!deleted) return res.status(404).json({ error: "Tenant not found" });
    res.json({ message: "Tenant deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 🔑 Issue new API Key
export const issueApiKey = async (req: Request, res: Response) => {
  try {
    const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const rawKey = crypto.randomBytes(32).toString("hex");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    tenant.apiKeys.push({ keyHash, issuedAt: new Date(), revoked: false });
    await tenant.save();

    res.status(201).json({ apiKey: rawKey }); // return raw key only once
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ❌ Revoke API Key
export const revokeApiKey = async (req: Request, res: Response) => {
  try {
    const tenant = await Tenant.findOne({ tenantId: req.params.tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const apiKey = tenant.apiKeys.find(k => k.keyHash === req.params.keyHash);
    if (!apiKey) return res.status(404).json({ error: "API Key not found" });

    apiKey.revoked = true;
    await tenant.save();

    res.json({ message: "API Key revoked" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 📅 Update subscription plan
export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, maxUsers, maxStudents, plan } = req.body;

    const tenant = await Tenant.findOneAndUpdate(
      { tenantId: req.params.tenantId },
      { 
        subscription: { startDate, endDate, status, maxUsers, maxStudents },
        plan,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    res.json(tenant);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
