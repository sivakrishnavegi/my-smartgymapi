import { Router } from "express";
import { google } from "googleapis";

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/google/callback" // redirect URL
);

const router = Router();
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
  res.redirect(url);
});

// Step 2: Handle callback
router.get("/callback", async (req, res) => {
  const code = req.query.code as string;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 👉 Save tokens in DB against logged-in user
    // e.g. User.findByIdAndUpdate(req.user.id, { googleTokens: tokens })

    console.log("Google Tokens:", tokens);

    // Redirect back to frontend after success
    res.redirect(
      "http://localhost:3001/dashboard/superadmin/settings?connected=true"
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Auth failed");
  }
});

export default router;
