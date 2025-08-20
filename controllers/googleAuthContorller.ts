import { serialize } from "cookie";
import { Request, Response } from "express";
import User from "../models/users.schema";
import { generateToken } from "../utils/genarateToken";


export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { account, profile, user: userData } = req.body;

    if (!userData?.email) {
      console.error("User email is missing");
      return res.status(400).json({ error: "User email is required" });
    }

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


