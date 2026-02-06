
import express from "express";
import { upsertTeacherProfile, getTeacherProfile, getTeacherClassesAndSections } from "@academics/controllers/teacherController";
// import { protect, authorize } from "@shared/middlewares/authMiddleware"; // Assuming middleware exists

const router = express.Router();

// Route to create or update a teacher profile
// POST /api/teachers/profile
router.post("/profile", upsertTeacherProfile);

// Route to get a teacher profile by User ID
// GET /api/teachers/:userId/profile
router.get("/:userId/profile", getTeacherProfile);

// Route to get classes and sections assigned to a teacher
// GET /api/teachers/:userId/classes
router.get("/:userId/classes", getTeacherClassesAndSections);

export default router;
