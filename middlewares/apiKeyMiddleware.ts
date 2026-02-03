import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { parseApiKey } from "../helpers/keys";
import Tenant from "@academics/models/tenant.schema";
import School from "@academics/models/schools.schema";
import { logError } from "../utils/errorLogger";

export interface ApiKeyAuthenticatedRequest extends Request {
    tenant?: any;
    school?: any;
    apiKeyEntry?: any;
}


export const apiKeyProtect = async (
    req: ApiKeyAuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const apiKey = req.headers["x-api-key"] as string;
        const tenantId = req.headers["x-tenant-id"] as string;

        console.log("[DEBUG] apiKeyProtect called", {
            hasApiKey: !!apiKey,
            tenantId,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 15) : "N/A"
        });
        const schoolId = req.headers["x-school-id"] as string;

        console.log("[DEBUG] apiKeyProtect called", {
            hasApiKey: !!apiKey,
            tenantId,
            schoolId,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + "..." : "N/A"
        });

        if (!apiKey || !tenantId) {
            console.log("[DEBUG] Missing headers");
            return res.status(401).json({
                success: false,
                message: "Missing x-api-key or x-tenant-id headers",
            });
        }

        const parsed = parseApiKey(apiKey);
        if (!parsed) {
            console.log("[DEBUG] Invalid API key format for:", apiKey);
            return res.status(401).json({
                success: false,
                message: "Invalid API key format. Expected format: prefix_env_keyId_secret (e.g. sk_live_...)",
            });
        }

        const { keyId, secret } = parsed;

        // 1. Find tenant and validate API key ID
        const tenant = await Tenant.findOne({
            tenantId,
            "apiKeys.keySecret": keyId,
        });

        if (!tenant) {
            console.log("[DEBUG] Tenant not found or keyId mismatch. TenantId:", tenantId, "KeyId:", keyId);
            return res.status(401).json({
                success: false,
                message: "Invalid Tenant ID or API key ID",
            });
        }

        // 2. Validate API key secret hash
        const apiKeyEntry = tenant.apiKeys.find((k) => k.keySecret === keyId);
        if (!apiKeyEntry || apiKeyEntry.revoked) {
            console.log("[DEBUG] API Key entry missing or revoked");
            return res.status(401).json({
                success: false,
                message: "API key has been revoked or is invalid",
            });
        }

        const secretHash = crypto.createHash("sha256").update(secret).digest("hex");
        if (secretHash !== apiKeyEntry.keyHash) {
            console.log("[DEBUG] Secret hash mismatch. Provided Secret:", secret, "Stored Hash:", apiKeyEntry.keyHash);
            return res.status(401).json({
                success: false,
                message: "Invalid API key secret",
            });
        }

        // 3. Verify School if schoolId is provided (optional for some routes, but required for school-config)
        if (schoolId) {
            const school = await School.findOne({ _id: schoolId, tenantId });
            if (!school) {
                return res.status(404).json({
                    success: false,
                    message: "School not found or does not belong to this tenant",
                });
            }
            req.school = school;
        }

        req.tenant = tenant;
        req.apiKeyEntry = apiKeyEntry;
        next();
    } catch (error) {
        console.error("[API KEY AUTH ERROR]", error);
        await logError(req, error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authentication",
        });
    }
};

