import bcrypt from "bcrypt";
import { serialize } from "cookie";
import { Request, Response } from "express";
import { SessionModel } from "../models/SessionSchema";
import User from "../models/users.schema";
import { generateToken } from "../utils/genarateToken";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(
      password,
      user?.account?.passwordHash!
    );
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken({
      //@ts-ignore
      _id: user._id.toString(),
      email: user.account?.primaryEmail!,
      role: user.userType,
    });

    // Set secure HTTP-only cookie
    res.setHeader(
      "Set-Cookie",
      serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // allow cross-site cookies
        maxAge: 60 * 60 * 24,
        path: "/",
        domain:
          process.env.NODE_ENV === "production"
            ? ".skoolelite.com"
            : "localhost",
      })
    );

    // Respond with user data (no token in body)
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.account?.primaryEmail,
        role: user.userType,
        token: token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role || "guest",
    });

    const token = generateToken({
      //@ts-ignore
      _id: newUser._id.toString(),
      email: newUser.account?.primaryEmail!,
      role: newUser.userType,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        email: newUser.account?.primaryEmail,
        role: newUser.userType,
      },
    });
  } catch (error) {
    console.error("[SIGNUP ERROR]", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const cookies = req.cookies || {};
    const token = req.cookies.refreshToken;
    if (token) {
      await SessionModel.deleteOne({ refreshToken: token });
    }
    Object.keys(cookies).forEach((cookieName) => {
      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/", // must match the cookie path
      });
      console.log(`Cleared cookie: ${cookieName}`);
    });

    // res.setHeader("Set-Cookie", [
    //   serialize("token", "", { maxAge: 0, path: "/" }),
    //   serialize("refreshToken", "", { maxAge: 0, path: "/" }),
    // ]);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
