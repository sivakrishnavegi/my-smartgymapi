import { Router } from "express";
import UserModel from "@iam/models/users.schema";
import { redis } from "../../services/redis/redisClient";

const router = Router();

/**
 * @swagger
 * /api/socket/online-users:
 *   get:
 *     summary: Get list of currently online users
 *     description: Fetches all users currently connected via socket
 *     tags:
 *       - Socket Users
 *     responses:
 *       200:
 *         description: Online users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 onlineUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "68abc80375247cc266808b79"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       email:
 *                         type: string
 *                         example: "john@example.com"
 *                       role:
 *                         type: string
 *                         example: "student"
 *       500:
 *         description: Internal server error
 */
router.get("/online-users", async (req, res) => {
  try {
    const onlineUserIds = await redis.hkeys("online_users");
    const users = await UserModel.find({ _id: { $in: onlineUserIds } }).select("_id name email role");
    res.json({ success: true, onlineUsers: users });
  } catch (err) {
    console.error("❌ Error fetching online users:", err);
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
});

export default router;
