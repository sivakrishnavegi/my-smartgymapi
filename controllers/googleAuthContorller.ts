import { serialize } from "cookie";
import { Request, Response } from "express";
import User from "../models/users.schema";
import { generateToken } from "../utils/genarateToken";
import { oauth2Client } from "../routes/googleAuthRoutes";
import { randomUUID } from "crypto";


export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { account, profile, user: userData } = req.body;

    if (!userData?.email) {
      console.error("User email is missing");
      return res.status(400).json({ error: "User email is required" });
    }
  console.log("first google  Auth ::")

    // 1. Find existing user
    let user = await User.findOne({ "account.email": userData.email });

    if (!user) {
      // 2. Create new user
      user = await User.create({
        tenantId: "default",
        schoolId: null,
        userType: userData.role ?? "guest",
        profile,
        account,
        providers: [
          {
            provider: account?.provider ?? "google",
            providerId: userData.id,
          },
        ],
      });
    } else {
      user.account = account;
      user.profile = profile;
      if (!user.providers.some((p) => p.providerId === userData.id)) {
        user.providers.push({
          provider: account?.provider ?? "google",
          providerId: userData.id,
        });
      }
      await user.save();
    }

    // 4. Generate JWT
    const token = generateToken({
      //@ts-ignore
      _id: user._id.toString(),
      email: user.account?.email!,
      role: user.userType,
    });


    // 5. Set HttpOnly cookie
    res.setHeader(
      "Set-Cookie",
      serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Lax allows localhost
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      })
    );

    const redirectUrl = `http://localhost:3001/dashboard/${user.userType}`;

    // 6. Respond with JSON including token and redirect URL
    return res.status(200).json({
      message: "Authentication successful",
      user: {
        id: user._id,
        email: user.account?.email,
        role: user.userType,
        token,
      },
      redirectUrl,
    });
  } catch (err) {
    console.error("Google Auth Callback Error:", err);
    return res.status(500).json({ error: "Authentication failed", details: err });
  }
};


export const googleAuthCallbacks = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;

    if (!code) {
      return res.status(400).send("Code not provided");
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.redirect("http://localhost:3001/login?error=invalid_google_payload");
    }

    // Prepare profile and account objects
    const profile = {
      firstName: payload.given_name,
      lastName: payload.family_name,
      photoUrl: payload.picture,
      contact: { email: payload.email },
    };

    const account = {
      email: payload.email,
      status: "active",
      google: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        idToken: tokens.id_token,
        tokenType: tokens.token_type,
        scope: tokens.scope,
      },
    };

    // Find existing user
    let user = await User.findOne({ "account.email": payload.email });

    if (!user) {
      // Create new user
      user = await User.create({
        tenantId: "default",
        schoolId: null,
        userType: "guest",
        profile,
        account,
        providers: [
          {
            provider: "google",
            providerId: payload.sub,
          },
        ],
        roles: [],
        linkedStudentIds: [],
      });
    } else {
      // Update existing user
      user.profile = profile;
      //@ts-ignore
      user?.account = account;
      if (!user.providers.some((p) => p.providerId === payload.sub)) {
        user.providers.push({
          provider: "google",
          providerId: payload.sub,
        });
      }
      await user.save();
    }

    // Generate JWT
    const token = await generateToken({
              //@ts-ignore
      _id: user._id.toString(),
            //@ts-ignore
      email: user.account.email,
      role:  user.userType ||  "guest",
    });

    // Set HttpOnly cookie
    res.setHeader(
      "Set-Cookie",
      serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      })
    );

    // Redirect to dashboard
    return res.redirect("http://localhost:3001/dashboard/admin");
  } catch (error) {
    console.error("Google Auth Callback Error:", error);
    return res.redirect("http://localhost:3001/login?error=google_auth_failed");
  }
};


