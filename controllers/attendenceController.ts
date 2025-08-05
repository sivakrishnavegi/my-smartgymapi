import { Request, Response } from 'express';
import Attendance from '../models/attendence.user';
import mongoose from 'mongoose';

export const checkIn = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingCheckIn = await Attendance.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (existingCheckIn) {
      return res.status(409).json({
        success: false,
        message: 'Already checked in today.',
        data: existingCheckIn,
      });
    }

    const attendance = await Attendance.create({
      userId,
      date: new Date(),
      checkInTime: new Date(),
      status: 'pending', // initially pending, can be updated to 'approved' by staff
    });

    return res.status(201).json({
      success: true,
      message: 'Check-in recorded. Awaiting staff approval.',
      data: attendance,
    });
  } catch (error) {
    console.error('[CHECK-IN ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};