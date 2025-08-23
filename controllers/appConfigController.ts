import { Request, Response } from "express";
import Tenant from "../models/tenant.schema";


export const getAppConfig = async (req: Request, res: Response) => {
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

    const tenant = await Tenant.findOne({ domain }).lean();

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
      isSchoolSetupCompleted : tenant.isSchoolSetupCompleted
    };

    return res.status(200).json({
      success: true,
      data: {
        domain,
        config,
      },
      message: "Tenant configuration fetched successfully",
    });
  } catch (err: any) {
    console.error("[getAppConfig] Error:", err);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: err?.message || "An unexpected error occurred",
      },
    });
  }
};
