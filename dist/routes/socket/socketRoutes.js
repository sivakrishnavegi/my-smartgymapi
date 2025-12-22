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
const express_1 = require("express");
const users_schema_1 = __importDefault(require("../../models/users.schema"));
const redisClient_1 = require("../../services/redis/redisClient");
const router = (0, express_1.Router)();
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
router.get("/online-users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const onlineUserIds = yield redisClient_1.redis.hkeys("online_users");
        const users = yield users_schema_1.default.find({ _id: { $in: onlineUserIds } }).select("_id name email role");
        res.json({ success: true, onlineUsers: users });
    }
    catch (err) {
        console.error("❌ Error fetching online users:", err);
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
}));
exports.default = router;
