import { Request, Response } from "express";
import mongoose from "mongoose";
import { RoleModel } from "@iam/models/roles.schema";
import { logError } from '@shared/utils/errorLogger';

// Create a role
export const createRole = async (req: Request, res: Response) => {
  try {
    const { tenantId, schoolId, name, description, permissions } = req.body;

    if (!tenantId || !schoolId || !name) {
      return res.status(400).json({ error: "tenantId, schoolId, and name are required." });
    }

    // Check if role already exists in this school/tenant
    const existingRole = await RoleModel.findOne({ tenantId, schoolId, name });
    if (existingRole) {
      return res.status(409).json({ error: "Role with this name already exists in the school." });
    }

    const role = new RoleModel({
      tenantId,
      schoolId,
      name,
      description,
      permissions: permissions || [],
    });

    await role.save();
    res.status(201).json({ message: "Role created successfully", role });
   }catch (err: any) {
    console.error("[CreateRole] Error creating role:", err);
    await logError(req, err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all roles
export const getRoles = async (req: Request, res: Response) => {
  try {
    const { tenantId, schoolId } = req.query;
    const filter: any = {};
    if (tenantId) filter.tenantId = tenantId;
    if (schoolId) filter.schoolId = schoolId;

    const roles = await RoleModel.find(filter);
    res.status(200).json({ roles });
   }catch (err: any) {
    console.error("[GetRoles] Error getting roles:", err);
    await logError(req, err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get single role
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid role id" });

    const role = await RoleModel.findById(id);
    if (!role) return res.status(404).json({ error: "Role not found" });

    res.status(200).json({ role });
   }catch (err: any) {
    console.error("[GetRoleById] Error getting role by ID:", err);
    await logError(req, err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid role id" });

    const role = await RoleModel.findById(id);
    if (!role) return res.status(404).json({ error: "Role not found" });

    // Prevent duplicate role name for the same school
    if (name && name !== role.name) {
      const exists = await RoleModel.findOne({
        tenantId: role.tenantId,
        schoolId: role.schoolId,
        name,
      });
      if (exists) return res.status(409).json({ error: "Role name already exists." });
    }

    role.name = name || role.name;
    role.description = description || role.description;
    role.permissions = permissions || role.permissions;

    await role.save();
    res.status(200).json({ message: "Role updated successfully", role });
   }catch (err: any) {
    console.error("[UpdateRole] Error updating role:", err);
    await logError(req, err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid role id" });

    const role = await RoleModel.findByIdAndDelete(id);
    if (!role) return res.status(404).json({ error: "Role not found" });

    res.status(200).json({ message: "Role deleted successfully" });
   }catch (err: any) {
    console.error("[DeleteRole] Error deleting role:", err);
    await logError(req, err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
