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
exports.updateSubscription = exports.revokeApiKey = exports.verifyApiKey = exports.issueApiKey = exports.deleteTenant = exports.updateTenant = exports.getTenantByDomainId = exports.getTenantById = exports.listTenants = exports.createTenant = void 0;
const crypto_1 = __importDefault(require("crypto"));
const keys_1 = require("../helpers/keys");
const schools_schema_1 = __importDefault(require("../models/schools.schema"));
const tenant_schema_1 = __importDefault(require("../models/tenant.schema"));
const createTenant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, domain, plan, subscription } = req.body;
        // Check if tenant with same domain already exists
        const existingTenant = yield tenant_schema_1.default.findOne({ domain });
        if (existingTenant) {
            return res
                .status(400)
                .json({ error: "Tenant with this domain already exists" });
        }
        const tenant = new tenant_schema_1.default({
            name,
            domain,
            plan,
            subscription,
        });
        yield tenant.save();
        res.status(201).json({
            message: "Tenant created successfully",
            tenant,
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.createTenant = createTenant;
//  Get all tenants
const listTenants = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenants = yield tenant_schema_1.default.find({}, { apiKeys: 0 }).lean();
        res.status(200).json({
            success: true,
            message: "Tenants fetched successfully",
            tenants,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.listTenants = listTenants;
//  Get tenant by ID
const getTenantById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("first get by id");
    try {
        const tenant = yield tenant_schema_1.default.findOne({ tenantId: req.params.tenantId });
        if (!tenant)
            return res.status(404).json({ error: "Tenant not found" });
        res.json(tenant);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.getTenantById = getTenantById;
//  Get tenant by DomainName
const getTenantByDomainId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Use path parameter
        const { domainId } = yield (req === null || req === void 0 ? void 0 : req.params);
        const tenant = yield tenant_schema_1.default.findOne({ domain: domainId });
        if (!tenant) {
            return res.status(404).json({ status: 404, error: "Tenant not found" });
        }
        // Find school(s) associated with this tenant
        const school = yield schools_schema_1.default.findOne({ tenantId: tenant === null || tenant === void 0 ? void 0 : tenant.tenantId });
        const schoolId = school && ((_a = school === null || school === void 0 ? void 0 : school._id) === null || _a === void 0 ? void 0 : _a.toString());
        yield res.json({
            tenant,
            schoolId,
        });
    }
    catch (err) {
        console.error("Error fetching tenant by domain:", err);
        res.status(500).json({ error: err.message });
    }
});
exports.getTenantByDomainId = getTenantByDomainId;
//  Update tenant info
const updateTenant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updated = yield tenant_schema_1.default.findOneAndUpdate({ tenantId: req.params.tenantId }, Object.assign(Object.assign({}, req.body), { updatedAt: new Date() }), { new: true });
        if (!updated)
            return res.status(404).json({ error: "Tenant not found" });
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.updateTenant = updateTenant;
//  Delete tenant
const deleteTenant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield tenant_schema_1.default.findOneAndDelete({
            tenantId: req.params.tenantId,
        });
        if (!deleted)
            return res.status(404).json({ error: "Tenant not found" });
        res.json({ message: "Tenant deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.deleteTenant = deleteTenant;
const issueApiKey = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tenantId } = req.params;
        //@ts-ignore
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const tenant = yield tenant_schema_1.default.findOne({ tenantId });
        if (!tenant)
            return res.status(404).json({ error: "Tenant not found" });
        // 1. Generate unique key parts
        const keyId = crypto_1.default.randomBytes(8).toString("hex"); // shorter prefix
        const keySecret = crypto_1.default.randomBytes(32).toString("hex");
        // 2. Build final API key (exposed to client only once)
        //    Example format: sk_live_<id>_<secret>
        const rawApiKey = `sk_live_${keyId}_${keySecret}`;
        // 3. Hash secret for storage (never store raw key!)
        const keyHash = crypto_1.default.createHash("sha256").update(keySecret).digest("hex");
        // 4. Save in DB
        tenant.apiKeys.push({
            keyHash,
            keySecret: keyId,
            issuedAt: new Date(),
            issuedBy: userId,
            revoked: false,
        });
        yield tenant.save();
        // 5. Return full key once
        res.status(201).json({
            apiKey: rawApiKey,
            message: "API key issued successfully. Store it securely, it won't be shown again.",
        });
    }
    catch (err) {
        console.error("Error issuing API key:", err);
        res.status(500).json({ error: "Failed to issue API key" });
    }
});
exports.issueApiKey = issueApiKey;
const verifyApiKey = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { apiKey, tenantId } = req.body;
        if (!apiKey || !tenantId) {
            return res
                .status(400)
                .json({ error: "apiKey and tenantId are required in body" });
        }
        const parsed = (0, keys_1.parseApiKey)(apiKey);
        if (!parsed) {
            return res.status(400).json({ error: "Invalid API key format" });
        }
        const { keyId, secret } = parsed;
        // 1. Find tenant and validate against tenantId
        const tenant = yield tenant_schema_1.default.findOne({
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
        const secretHash = crypto_1.default.createHash("sha256").update(secret).digest("hex");
        if (secretHash !== apiKeyEntry.keyHash) {
            return res.status(403).json({ error: "Invalid API key secret" });
        }
        yield tenant_schema_1.default.findOneAndUpdate({ tenantId }, { isApiKeysVerified: true }, { upsert: true, new: true });
        // 5. Success → attach tenant info
        req.tenant = tenant;
        return res.status(200).json({
            valid: true,
            tenantId: tenant.tenantId,
            issuedBy: apiKeyEntry.issuedBy,
            issuedAt: apiKeyEntry.issuedAt,
        });
    }
    catch (err) {
        console.error("Error verifying API key:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.verifyApiKey = verifyApiKey;
//  Revoke API Key
const revokeApiKey = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tenant = yield tenant_schema_1.default.findOne({ tenantId: req.params.tenantId });
        if (!tenant)
            return res.status(404).json({ error: "Tenant not found" });
        const apiKey = tenant.apiKeys.find((k) => k.keyHash === req.params.keyHash);
        if (!apiKey)
            return res.status(404).json({ error: "API Key not found" });
        apiKey.revoked = true;
        yield tenant.save();
        res.json({ message: "API Key revoked" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.revokeApiKey = revokeApiKey;
// Update subscription plan
const updateSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate, status, maxUsers, maxStudents, plan } = req.body;
        const tenant = yield tenant_schema_1.default.findOneAndUpdate({ tenantId: req.params.tenantId }, {
            subscription: { startDate, endDate, status, maxUsers, maxStudents },
            plan,
            updatedAt: new Date(),
        }, { new: true });
        if (!tenant)
            return res.status(404).json({ error: "Tenant not found" });
        res.json(tenant);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.updateSubscription = updateSubscription;
