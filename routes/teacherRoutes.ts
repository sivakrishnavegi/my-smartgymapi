
import express from "express";
import { upsertTeacherProfile, getTeacherProfile } from "../controllers/teacherController";
// import { protect, authorize } from "../middlewares/authMiddleware"; // Assuming middleware exists

const router = express.Router();

// Route to create or update a teacher profile
// POST /api/teachers/profile
router.post("/profile", upsertTeacherProfile);

// Route to get a teacher profile by User ID
// GET /api/teachers/:userId/profile
router.get("/:userId/profile", getTeacherProfile);

export default router;
