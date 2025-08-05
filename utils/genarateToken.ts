import jwt from 'jsonwebtoken'
import { IUser } from '../types/user'

export const generateToken = (user: IUser) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET_KEY!,
    { expiresIn: '2h' }
  )
}
