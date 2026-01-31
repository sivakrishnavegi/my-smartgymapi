import express from "express";
import {
    getGovernanceConfig,
    updateGovernanceConfig,
    resetGovernanceConfig
} from "../controllers/aiGovernanceController";
import { protect, authorize } from "../middlewares/authMiddleware";

const router = express.Router();

router.route("/config")
    .get(protect, getGovernanceConfig)
    .put(protect, authorize("admin"), updateGovernanceConfig);

router.post("/restore-defaults", protect, authorize("admin"), resetGovernanceConfig);

export default router;
