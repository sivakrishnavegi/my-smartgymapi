import { Request, Response } from 'express'
import User from '../models/auth.user'
import { generateToken } from '../utils/genarateToken'
import bcrypt from 'bcrypt'

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = generateToken({
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
  })

  res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
  })
}

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

