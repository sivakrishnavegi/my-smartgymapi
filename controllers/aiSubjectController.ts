import { Request, Response } from "express";
import * as AiSubjectService from "../services/aiSubjectService";
import { getPagination, buildPaginationResponse } from "../utils/pagination";
import { cacheService } from "../services/cacheService";

/**
 * Get the AI Control Tower dashboard data
 * GET /api/ai-subjects/control-tower?tenantId=...&schoolId=...
 */
export const getControlTower = async (req: Request, res: Response) => {
    try {
        const { tenantId, schoolId } = req.query;

        if (!tenantId || !schoolId) {
            return res.status(400).json({ message: "tenantId and schoolId are required" });
        }

        const { page, limit, skip } = getPagination(req);

        const { data, total } = await AiSubjectService.getControlTowerList({
            tenantId: tenantId as string,
            schoolId: schoolId as string,
            skip,
            limit
        });

        return res.status(200).json({
            message: "Control Tower data fetched successfully",
            data,
            pagination: buildPaginationResponse(page, limit, total),
        });
    } catch (error: any) {
        console.error("Control Tower Fetch Error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

/**
 * Toggle AI Active Status for a subject
 * PATCH /api/ai-subjects/:subjectId/toggle
 */
export const toggleAiStatus = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        const { tenantId, schoolId, isActive, enabledClasses } = req.body;

        if (!tenantId || !schoolId) {
            return res.status(400).json({ message: "tenantId and schoolId are required" });
        }

        const config = await AiSubjectService.toggleSubjectAi({
            tenantId,
            schoolId,
            subjectId,
            isActive,
            enabledClasses,
        });

        // Invalidate Cache for this school's dashboard
        const pattern = cacheService.generateKey("ct", tenantId, schoolId, "*");
        await cacheService.clearPattern(pattern);

        return res.status(200).json({
            message: `AI Status updated to ${isActive ? "Active" : "Inactive"}`,
            data: config,
        });
    } catch (error: any) {
        console.error("Toggle AI Status Error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
