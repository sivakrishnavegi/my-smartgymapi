import { Request, Response } from "express";
import { AiGovernanceConfigModel, IAiGovernanceConfig } from "@ai/models/AiGovernanceConfig.model";
import { AiService } from "@ai/services/aiService";

/**
 * Get Governance Config
 * @route GET /api/ai-governance/config
 */
export const getGovernanceConfig = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { tenantId: queryTenantId, schoolId: querySchoolId } = req.query;

        const tenantId = queryTenantId || user.tenantId;
        const schoolId = querySchoolId || user.schoolId;

        if (user.role !== 'admin' && tenantId !== user.tenantId) {
            return res.status(403).json({ success: false, message: "Unauthorized." });
        }

        let config = await AiGovernanceConfigModel.findOne({ tenantId, schoolId });

        if (!config) {
            // Return defaults if not found, but don't save yet until they customize
            config = new AiGovernanceConfigModel({ tenantId, schoolId });
        }

        res.status(200).json({ success: true, data: config });
    } catch (error: any) {
        console.error("Get Governance Config Error:", error);
        res.status(500).json({ success: false, message: "Error fetching governance config" });
    }
};

/**
 * Update Governance Config
 * @route PUT /api/ai-governance/config
 */
export const updateGovernanceConfig = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { globalSystemPrompt, teachingStyles, safetyGuardrails, tenantId: bodyTenantId, schoolId: bodySchoolId } = req.body;

        const tenantId = bodyTenantId || user.tenantId;
        const schoolId = bodySchoolId || user.schoolId;

        if (user.role !== 'admin' && tenantId !== user.tenantId) {
            return res.status(403).json({ success: false, message: "Unauthorized." });
        }

        const updatedConfig = await AiGovernanceConfigModel.findOneAndUpdate(
            { tenantId, schoolId },
            {
                $set: {
                    globalSystemPrompt,
                    teachingStyles,
                    safetyGuardrails,
                    version: new Date().getTime() // simple versioning
                }
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "AI Governance configuration updated",
            data: updatedConfig
        });

    } catch (error: any) {
        console.error("Update Governance Config Error:", error);
        res.status(500).json({ success: false, message: "Error updating governance config" });
    }
};

/**
 * Reset Governance Config to Defaults
 * @route POST /api/ai-governance/restore-defaults
 */
export const resetGovernanceConfig = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { tenantId: bodyTenantId, schoolId: bodySchoolId } = req.body;

        const tenantId = bodyTenantId || user.tenantId;
        const schoolId = bodySchoolId || user.schoolId;

        if (user.role !== 'admin' && tenantId !== user.tenantId) {
            return res.status(403).json({ success: false, message: "Unauthorized." });
        }

        await AiGovernanceConfigModel.findOneAndDelete({ tenantId, schoolId });

        // Create a fresh default one
        const defaultConfig = new AiGovernanceConfigModel({ tenantId, schoolId });
        await defaultConfig.save();

        res.status(200).json({
            success: true,
            message: "AI Governance configuration restored to defaults",
            data: defaultConfig
        });

    } catch (error: any) {
        console.error("Reset Governance Config Error:", error);
        res.status(500).json({ success: false, message: "Error resetting governance config" });
    }
};

/**
 * Get Vector DB Health
 * @route GET /api/ai-governance/vector-db-health
 */
export const getVectorDbHealth = async (req: Request, res: Response) => {
    try {
        const health = await AiService.checkVectorDbHealth();
        res.status(200).json(health);
    } catch (error: any) {
        console.error("Get Vector DB Health Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching Vector DB health",
            error: error.message
        });
    }
};

/**
 * Get Redis Health
 * @route GET /api/ai-governance/redis-health
 */
export const getRedisHealth = async (req: Request, res: Response) => {
    try {
        const health = await AiService.checkRedisHealth();
        res.status(200).json(health);
    } catch (error: any) {
        console.error("Get Redis Health Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching Redis health",
            error: error.message
        });
    }
};
