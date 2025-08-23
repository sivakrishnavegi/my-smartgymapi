// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/users.schema'; 
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: "admin" | "user" | "trainer";
    email?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET_KEY as string;

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token;

  try {
    // Get token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as {
        _id: string;
        email: string;
        role: string;
      };
      // Optional: Fetch user details from DB (can be omitted for speed)
      const user = await User.findById(decoded._id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach user to req object
      req.user = {
        //@ts-ignore
        id: user._id.toString(),
        role: user.userType as "admin" | "user" | "trainer",
        email: user.account?.primaryEmail,
      };

      next();
    } else {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }
  } catch (error) {
    console.error('[AUTH ERROR]', error);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};
