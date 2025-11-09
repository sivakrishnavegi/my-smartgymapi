"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const googleMeetControler_1 = require("../controllers/googleMeetControler");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/googleMeet/createGoogleMeet:
 *   post:
 *     summary: Create a Google Meet and add it to the user's Google Calendar
 *     description: |
 *       This endpoint creates a Google Calendar event with an attached Google Meet link.
 *       Requires a valid Google OAuth access token stored in the user's account.
 *     tags:
 *       - Calendar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Team Meeting"
 *                 description: Optional field for event title (same as summary)
 *               summary:
 *                 type: string
 *                 example: "Project Discussion"
 *               description:
 *                 type: string
 *                 example: "Discussion about the upcoming project"
 *               start:
 *                 type: object
 *                 properties:
 *                   dateTime:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-08-22T10:00:00+05:30"
 *                   timeZone:
 *                     type: string
 *                     example: "Asia/Kolkata"
 *               end:
 *                 type: object
 *                 properties:
 *                   dateTime:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-08-22T11:00:00+05:30"
 *                   timeZone:
 *                     type: string
 *                     example: "Asia/Kolkata"
 *     responses:
 *       201:
 *         description: Google Meet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Google Meet created and added to calendar"
 *                 eventId:
 *                   type: string
 *                   example: "abcd1234efgh5678"
 *                 meetLink:
 *                   type: string
 *                   example: "https://meet.google.com/xyz-abcd-pqr"
 *       401:
 *         description: Unauthorized (no user or invalid access token)
 *       500:
 *         description: Failed to create Google Meet event
 */
router.post("/createMeetEvent", authMiddleware_1.protect, googleMeetControler_1.createGoogleMeetEvent);
exports.default = router;
