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
exports.getSuperAdmin = exports.superAdminLogin = exports.createSuperAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tenant_schema_1 = __importDefault(require("../../models/tenant.schema"));
const schools_schema_1 = __importDefault(require("../../models/schools.schema"));
const users_schema_1 = __importDefault(require("../../models/users.schema"));
const JWT_SECRET = process.env.JWT_SECRET_KEY || "your_secret_key";
// ------------------ Create SuperAdmin ------------------
const createSuperAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantId, schoolId, email: userEmail, password, firstName, lastName } = req.body;
        // Normalize and validate email if provided
        let normalizedEmail;
        if (userEmail) {
            normalizedEmail = userEmail.toLowerCase().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                return res.status(400).json({ error: "Invalid email format in account" });
            }
        }
        if (!tenantId || !userEmail || !password) {
            return res.status(400).json({ error: "tenantId, email, and password are required" });
        }
        // Validate tenant exists
        const tenant = yield tenant_schema_1.default.findOne({ tenantId });
        if (!tenant)
            return res.status(404).json({ error: "Tenant not found" });
        // Optional: validate schoolId exists and belongs to tenant
        if (schoolId) {
            const school = yield schools_schema_1.default.findOne({ _id: schoolId, tenantId });
            if (!school)
                return res.status(404).json({ error: "School not found for this tenant" });
        }
        // Check if superadmin already exists for this tenant
        const existingSuperAdmin = yield users_schema_1.default.findOne({ tenantId, userType: "superadmin" });
        if (existingSuperAdmin) {
            return res.status(409).json({ error: "SuperAdmin already exists for this tenant" });
        }
        // Hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Create superadmin user
        const superAdmin = new users_schema_1.default({
            tenantId,
            schoolId: schoolId,
            userType: "superadmin",
            profile: { firstName, lastName },
            account: { primaryEmail: normalizedEmail, passwordHash: hashedPassword, status: "inactive" },
            providers: [{ provider: "local" }],
        });
        yield superAdmin.save();
        res.status(201).json({ message: "SuperAdmin created successfully", superAdminId: superAdmin._id });
    }
    catch (err) {
        console.error("Create SuperAdmin Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.createSuperAdmin = createSuperAdmin;
// ------------------ SuperAdmin Login ------------------
const superAdminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tenantId, email, password } = req.body;
        if (!tenantId || !email || !password) {
            return res.status(400).json({ error: "tenantId, email, and password are required" });
        }
        // Find superadmin
        const superAdmin = yield users_schema_1.default.findOne({ tenantId, userType: "superadmin", "account.primaryEmail": email });
        if (!superAdmin)
            return res.status(404).json({ error: "SuperAdmin not found" });
        // Validate password
        const isMatch = yield bcrypt_1.default.compare(password, ((_a = superAdmin.account) === null || _a === void 0 ? void 0 : _a.passwordHash) || "");
        if (!isMatch)
            return res.status(401).json({ error: "Invalid credentials" });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: superAdmin._id, tenantId: superAdmin.tenantId, role: "superadmin" }, JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({ message: "Login successful", token, superAdminId: superAdmin._id });
    }
    catch (err) {
        console.error("SuperAdmin Login Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.superAdminLogin = superAdminLogin;
// ------------------ Get SuperAdmin Info ------------------
const getSuperAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tenantId } = req.params;
        if (!tenantId)
            return res.status(400).json({ error: "tenantId is required" });
        const superAdmin = yield users_schema_1.default.findOne({ tenantId, userType: "superadmin" }).select("-account.passwordHash");
        if (!superAdmin)
            return res.status(404).json({ error: "SuperAdmin not found" });
        res.status(200).json({ superAdmin });
    }
    catch (err) {
        console.error("Get SuperAdmin Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getSuperAdmin = getSuperAdmin;
