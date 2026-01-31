import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendance extends Document {
  userId: Types.ObjectId;
  date: Date;
  checkInTime: Date;
  status: 'pending' | 'approved';
  verifiedBy?: Types.ObjectId;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved'],
      default: 'pending',
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
