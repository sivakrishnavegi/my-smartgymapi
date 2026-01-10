import { serialize } from "cookie";
import { Request, Response } from "express";
import User, { IGoogleAuth, IProfile } from "../models/users.schema";
import { oauth2Client } from "../routes/googleAuthRoutes";
import { generateToken } from "../utils/genarateToken";
import { logError } from '../utils/errorLogger';

export const googleAuthCallbackSignInButton = async (
  req: Request,
  res: Response
) => {
  try {
    const { account, profile, user: userData } = req.body;

    if (!userData?.email) {
      return res.status(400).json({ error: "User email is required" });
    }
    // 1. Find existing user
    let user = await User.findOne({ "account.primaryEmail": userData.email });

    const updatedProfile: IProfile = {
      firstName: profile?.firstName,
      lastName: profile?.family_name,
      dob: profile?.dob,
      gender: profile?.gender,
      photoUrl: userData?.image,
      address: profile?.address,
      contact: profile?.contact,
    };

    const updateGoogleData: IGoogleAuth = {
      accessToken: account?.access_token,
      expiryDate: account?.expires_at, // usually epoch timestamp (ms or s)
      idToken: account?.id_token,
      tokenType: account?.type,
      scope: account?.scope,
    };

    if (!user) {
      // 2. Create new user
      user = await User.create({
        tenantId: "default",
        schoolId: null,
        userType: userData.role ?? "guest",
        profile: { ...updatedProfile },
        account: {
          primaryEmail: userData.email,
          google: { ...updateGoogleData },
        },
        integrationPermissions: {
          googleSignInAuth: "granted",
        },
        providers: [
          {
            provider: account?.provider ?? "google",
            providerId: userData.id,
          },
        ],
      });
    } else {
      const provider = account?.provider ?? "google";

      // Update user atomically
      const updatedUsr = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            "account.primaryEmail": userData.email,
            "account.google": updateGoogleData,
            integrationPermissions: {
              googleSignInAuth: "granted",
            },
            profile: updatedProfile,
            "providers.$[elem]": {
              provider,
              providerId: userData.id,
            },
          },
        },
        {
          new: true,
          arrayFilters: [{ "elem.provider": provider }], // match provider inside array
          upsert: false,
        }
      );
      await updatedUsr?.save();
    }
    // 4. Generate JWT
    const token = generateToken({
      //@ts-ignore
      _id: user?._id,
      email: user.account?.primaryEmail!,
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
        email: user.account?.primaryEmail,
        role: user.userType,
        token,
      },
      redirectUrl,
    });
  } catch (err) {
    console.error("Google Auth Callback Error:", err);
    await logError(req, err);
    return res
      .status(500)
      .json({ error: "Authentication failed", details: err });
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
      return res.redirect(
        "http://localhost:3001/login?error=invalid_google_payload"
      );
    }

    const updatedProfile = {
      firstName: payload?.name,
      lastName: payload?.family_name,
      photoUrl: payload?.picture,
    };

    const updateGoogleData = {
      accessToken: tokens?.access_token,
      expiryDate: tokens?.expiry_date, // usually epoch timestamp (ms or s)
      idToken: tokens?.id_token,
      tokenType: tokens?.token_type,
      scope: tokens?.scope,
      refreshToken: tokens?.refresh_token,
    };

    // Find existing user
    let user = await User.findOne({ "account.primaryEmail": payload.email });

    if (!user) {
      // 2. Create new user
      await User.create({
        tenantId: "default",
        schoolId: null,
        integrationPermissions: {
          googleSignInAuth: "granted",
          googleCalender: "granted",
        },
        //@ts-ignore
        userType: user?.userType ?? "guest",
        profile: { ...updatedProfile },
        account: {
          primaryEmail: payload.email,
          google: { ...updateGoogleData },
        },
        providers: [
          {
            provider: "google",
          },
        ],
      });
    } else {
      const provider = "google";
      // Update user atomically
      const updatedUsr = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            "account.primaryEmail": payload.email,
            "account.google": updateGoogleData,
            profile: updatedProfile,
            "providers.$[elem]": {
              provider,
              providerId: user.id,
            },
            integrationPermissions: {
              googleSignInAuth: "granted",
              googleCalender: "granted",
            },
          },
        },
        {
          new: true,
          arrayFilters: [{ "elem.provider": provider }], // match provider inside array
          upsert: false,
        }
      );
      await updatedUsr?.save();
    }

    // Generate JWT
    const token = await generateToken({
      //@ts-ignore
      _id: user?._id,
      email: payload.email,
      role: user?.userType || "guest",
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
    await logError(req, error);
    return res.redirect("http://localhost:3001/login?error=google_auth_failed");
  }
};
