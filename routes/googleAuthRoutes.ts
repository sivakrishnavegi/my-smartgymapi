import { Router } from "express";
import { google } from "googleapis";
import { googleAuthCallback, googleAuthCallbacks } from "../controllers/googleAuthContorller";

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
      "https://www.googleapis.com/auth/calendar.events",
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar",
    ],
    prompt: "consent",
  });
  console.log("first google ::",url)
  res.redirect(url);
});

// Step 2: Handle callback
router.get("/callback", googleAuthCallbacks);

//ui frontend google btn
router.post("/callbackUi", googleAuthCallback);


export default router;
