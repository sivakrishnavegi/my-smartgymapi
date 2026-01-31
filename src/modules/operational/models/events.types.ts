import { Types } from 'mongoose';

export interface IEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  bannerUrl?: string;
  createdBy: Types.ObjectId;  // <- Use ObjectId type
}

export interface IEventDocument extends IEvent, Document {}
