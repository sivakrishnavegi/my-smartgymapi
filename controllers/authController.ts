import { Request, Response } from 'express'
import User from '../models/auth.user'
import { generateToken } from '../utils/genarateToken'
import bcrypt from 'bcrypt'
import { serialize } from "cookie";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set secure HTTP-only cookie
res.setHeader(
  "Set-Cookie",
  serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  })
);


    // Respond with user data (no token in body)
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const signup = async (req: Request, res: Response) => {
  const { email, password, role } = req.body

  try {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role || 'user',
    })

    const token = generateToken({
      _id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    })

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    })
  } catch (error) {
    console.error('[SIGNUP ERROR]', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const logout = (req: Request, res: Response) => {
  try {
    // Clear the token cookie
    res.setHeader(
      "Set-Cookie",
      serialize("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0, // Expire immediately
        path: "/",
      })
    );

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};