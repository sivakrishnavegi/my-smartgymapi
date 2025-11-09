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
exports.createGoogleMeetEvent = void 0;
const GoogleMeetSchema_1 = __importDefault(require("../models/GoogleMeetSchema"));
const users_schema_1 = __importDefault(require("../models/users.schema"));
const createGoogleMeetEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        // fetch user from DB
        const user = yield users_schema_1.default.findById(userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "No Google access token found for this user",
            });
        }
        const accessToken = (_c = (_b = user === null || user === void 0 ? void 0 : user.account) === null || _b === void 0 ? void 0 : _b.google) === null || _c === void 0 ? void 0 : _c.accessToken;
        // pull event details from request body
        const { title, summary, description, start, end } = req.body;
        if (!summary && !title) {
            return res.status(400).json({
                success: false,
                message: "Event must include at least a title or summary",
            });
        }
        if (!(start === null || start === void 0 ? void 0 : start.dateTime) || !(end === null || end === void 0 ? void 0 : end.dateTime)) {
            return res.status(400).json({
                success: false,
                message: "Event must include start and end dateTime",
            });
        }
        // ✅ Check for time clash for this user
        const clash = yield GoogleMeetSchema_1.default.findOne({
            createdBy: userId,
            $or: [
                {
                    "event.start.dateTime": { $lt: end.dateTime },
                    "event.end.dateTime": { $gt: start.dateTime },
                },
            ],
        });
        if (clash) {
            return res.status(409).json({
                success: false,
                message: "You already have a meeting scheduled in this time slot",
                conflictingEvent: clash,
            });
        }
        // construct event body
        const eventBody = {
            summary: title || summary,
            description,
            start,
            end,
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                },
            },
        };
        // call Google Calendar API
        const response = yield fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(eventBody),
        });
        const data = yield response.json();
        if (!response.ok) {
            throw new Error(`Google API error: ${response.status} ${JSON.stringify(data)}`);
        }
        const savedEvent = yield GoogleMeetSchema_1.default.create({
            success: true,
            message: "Google Meet created and added to calendar",
            eventId: data.id,
            meetLink: data.hangoutLink || ((_f = (_e = (_d = data.conferenceData) === null || _d === void 0 ? void 0 : _d.entryPoints) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.uri),
            createdBy: userId,
            event: data,
        });
        return res.status(201).json({
            success: true,
            message: "Google Meet created and added to calendar",
            eventId: savedEvent.eventId,
            meetLink: savedEvent.meetLink,
            event: savedEvent,
        });
    }
    catch (err) {
        console.error("Error creating Google Meet event:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to create Google Meet event",
            error: err instanceof Error ? err.message : err,
        });
    }
});
exports.createGoogleMeetEvent = createGoogleMeetEvent;
