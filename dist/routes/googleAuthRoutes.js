"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauth2Client = void 0;
const express_1 = require("express");
const googleapis_1 = require("googleapis");
const googleAuthContorller_1 = require("../controllers/googleAuthContorller");
const router = (0, express_1.Router)();
exports.oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "http://localhost:3000/api/google/callback" // redirect URL
);
router.get("/auth", (req, res) => {
    const url = exports.oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            // 🔑 Identity & profile scopes
            "openid",
            "email",
            "profile",
            // 📅 Google Calendar scopes
            "https://www.googleapis.com/auth/calendar", // full access (read/write all calendars/events)
            "https://www.googleapis.com/auth/calendar.events", // manage events on all calendars
            "https://www.googleapis.com/auth/calendar.readonly", // read-only access
            "https://www.googleapis.com/auth/calendar.events.readonly", // read-only events
            "https://www.googleapis.com/auth/meetings.space.created",
            "https://www.googleapis.com/auth/meetings.space.readonly",
            "https://www.googleapis.com/auth/meetings.space.settings",
            "https://www.googleapis.com/auth/calendar.addons.execute", // needed for Meet Add-ons
            "https://www.googleapis.com/auth/calendar.calendars", // manage calendar list
            "https://www.googleapis.com/auth/calendar.settings.readonly", // read settings
        ],
        prompt: "consent",
    });
    console.log("first google ::", url);
    res.redirect(url);
});
// Step 2: Handle callback
router.get("/callback", googleAuthContorller_1.googleAuthCallbacks);
//ui frontend google btn
router.post("/callbackUi", googleAuthContorller_1.googleAuthCallbackSignInButton);
exports.default = router;
