import { Router } from "express";
import { google } from "googleapis";
import {
  googleAuthCallbackSignInButton,
  googleAuthCallbacks,
} from "../controllers/googleAuthContorller";

const router = Router();

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/google/callback" // redirect URL
);

router.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
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

      // 🎥 Google Meet (conferenceData)
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
router.get("/callback", googleAuthCallbacks);

//ui frontend google btn
router.post("/callbackUi", googleAuthCallbackSignInButton);

export default router;
