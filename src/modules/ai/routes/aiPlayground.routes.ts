import { Router } from "express";
import { handleChat } from "@ai/controllers/aiPlaygroundController";
import { protect } from "@shared/middlewares/authMiddleware";

const router = Router();

router.post("/chat", protect, handleChat);

export default router;
