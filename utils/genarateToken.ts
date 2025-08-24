import jwt from 'jsonwebtoken'
import { IUser } from '../types/user'

export const generateToken = (user: IUser) => {
  return jwt.sign(
    { _id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET_KEY!,
    { expiresIn: '2h' }
  )
}

export const generateRefreshToken = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
};
