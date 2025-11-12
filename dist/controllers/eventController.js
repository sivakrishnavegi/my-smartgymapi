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
exports.getEvents = exports.createEvent = void 0;
const event_model_1 = __importDefault(require("../models/event.model"));
const googleCalendar_1 = __importDefault(require("../utils/google/googleCalendar"));
const users_schema_1 = __importDefault(require("../models/users.schema"));
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description, startDate, endDate, bannerUrl } = req.body;
        // Create event in MongoDB
        const newEvent = yield event_model_1.default.create({
            title,
            description,
            startDate,
            endDate,
            bannerUrl,
            createdBy: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id, // from auth middleware
        });
        // Push event to Google Calendar
        //   calendarId: 'c2fbf05f64dae08edb6a733b3345c7fcd70cf5d366bdfd5d518aa5c0644a5886@group.calendar.google.com',
        const googleEvent = yield googleCalendar_1.default.events.insert({
            calendarId: "c2fbf05f64dae08edb6a733b3345c7fcd70cf5d366bdfd5d518aa5c0644a5886@group.calendar.google.com",
            requestBody: {
                summary: title,
                description,
                start: { dateTime: new Date(startDate).toISOString() },
                end: { dateTime: new Date(endDate).toISOString() },
            },
        });
        // Log the created Google Calendar event
        console.log("Google Calendar Event Created:", googleEvent.data);
        // Optionally, store googleEvent.data.id
        // newEvent.googleCalendarId = googleEvent.data.id;
        yield newEvent.save();
        return res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: newEvent,
            googleEvent: googleEvent.data, // optionally return it to frontend
        });
    }
    catch (err) {
        console.error("Error creating event:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err instanceof Error ? err.message : err,
        });
    }
});
exports.createEvent = createEvent;
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d;
    try {
        // get user id from auth middleware (e.g., req.user.id)
        const userId = (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.id;
        console.log("first ggg", userId);
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
        console.log("first ggg", user);
        const accessToken = (_d = (_c = user === null || user === void 0 ? void 0 : user.account) === null || _c === void 0 ? void 0 : _c.google) === null || _d === void 0 ? void 0 : _d.accessToken;
        // Call Google Calendar API directly
        const response = yield fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            const errorBody = yield response.json();
            throw new Error(`Google API error: ${response.status} ${JSON.stringify(errorBody)}`);
        }
        const data = yield response.json();
        return res.status(200).json({
            success: true,
            message: "Calendars fetched successfully",
            data: data.items || [],
        });
    }
    catch (err) {
        console.error("Error fetching Google Calendars:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch calendars",
            error: err instanceof Error ? err.message : err,
        });
    }
});
exports.getEvents = getEvents;
