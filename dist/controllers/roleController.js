"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRole = exports.updateRole = exports.getRoleById = exports.getRoles = exports.createRole = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const roles_schema_1 = require("../models/roles.schema");
// Create a role
const createRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantId, schoolId, name, description, permissions } = req.body;
        if (!tenantId || !schoolId || !name) {
            return res.status(400).json({ error: "tenantId, schoolId, and name are required." });
        }
        // Check if role already exists in this school/tenant
        const existingRole = yield roles_schema_1.RoleModel.findOne({ tenantId, schoolId, name });
        if (existingRole) {
            return res.status(409).json({ error: "Role with this name already exists in the school." });
        }
        const role = new roles_schema_1.RoleModel({
            tenantId,
            schoolId,
            name,
            description,
            permissions: permissions || [],
        });
        yield role.save();
        res.status(201).json({ message: "Role created successfully", role });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.createRole = createRole;
// Get all roles
const getRoles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantId, schoolId } = req.query;
        const filter = {};
        if (tenantId)
            filter.tenantId = tenantId;
        if (schoolId)
            filter.schoolId = schoolId;
        const roles = yield roles_schema_1.RoleModel.find(filter);
        res.status(200).json({ roles });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.getRoles = getRoles;
// Get single role
const getRoleById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return res.status(400).json({ error: "Invalid role id" });
        const role = yield roles_schema_1.RoleModel.findById(id);
        if (!role)
            return res.status(404).json({ error: "Role not found" });
        res.status(200).json({ role });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.getRoleById = getRoleById;
// Update role
const updateRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description, permissions } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return res.status(400).json({ error: "Invalid role id" });
        const role = yield roles_schema_1.RoleModel.findById(id);
        if (!role)
            return res.status(404).json({ error: "Role not found" });
        // Prevent duplicate role name for the same school
        if (name && name !== role.name) {
            const exists = yield roles_schema_1.RoleModel.findOne({
                tenantId: role.tenantId,
                schoolId: role.schoolId,
                name,
            });
            if (exists)
                return res.status(409).json({ error: "Role name already exists." });
        }
        role.name = name || role.name;
        role.description = description || role.description;
        role.permissions = permissions || role.permissions;
        yield role.save();
        res.status(200).json({ message: "Role updated successfully", role });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.updateRole = updateRole;
// Delete role
const deleteRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return res.status(400).json({ error: "Invalid role id" });
        const role = yield roles_schema_1.RoleModel.findByIdAndDelete(id);
        if (!role)
            return res.status(404).json({ error: "Role not found" });
        res.status(200).json({ message: "Role deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.deleteRole = deleteRole;
