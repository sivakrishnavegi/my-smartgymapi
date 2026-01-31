import express from "express";
import {
    getGovernanceConfig,
    updateGovernanceConfig,
    resetGovernanceConfig,
    getVectorDbHealth,
    getRedisHealth
} from "@ai/controllers/aiGovernanceController";
import { protect, authorize } from "@shared/middlewares/authMiddleware";

const router = express.Router();

router.route("/config")
    .get(protect, getGovernanceConfig)
    .put(protect, authorize("admin"), updateGovernanceConfig);

router.post("/restore-defaults", protect, authorize("admin"), resetGovernanceConfig);

router.get("/vector-db-health", protect, getVectorDbHealth);

router.get("/redis-health", protect, getRedisHealth);

export default router;
