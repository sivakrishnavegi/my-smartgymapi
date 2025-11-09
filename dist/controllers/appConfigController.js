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
exports.getAppConfig = void 0;
const tenant_schema_1 = __importDefault(require("../models/tenant.schema"));
const getAppConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { domain } = req.body;
        if (!domain) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "DOMAIN_REQUIRED",
                    message: "Domain is required in request body",
                },
            });
        }
        const tenant = yield tenant_schema_1.default.findOne({ domain }).lean();
        if (!tenant) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "TENANT_NOT_FOUND",
                    message: `No tenant found for domain: ${domain}`,
                },
            });
        }
        // Return only config fields
        const config = {
            tenantId: tenant.tenantId,
            sassSetupCompleted: tenant.isSassSetupCompleted,
            isApiKeysVerified: tenant.isApiKeysVerified,
            isSchoolSetupCompleted: tenant.isSchoolSetupCompleted
        };
        return res.status(200).json({
            success: true,
            data: {
                domain,
                config,
            },
            message: "Tenant configuration fetched successfully",
        });
    }
    catch (err) {
        console.error("[getAppConfig] Error:", err);
        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: (err === null || err === void 0 ? void 0 : err.message) || "An unexpected error occurred",
            },
        });
    }
});
exports.getAppConfig = getAppConfig;
