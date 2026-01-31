// src/models/event.model.ts
import { Schema, model } from 'mongoose';
import { IEvent, IEventDocument } from '@operational/models/events.types';

const EventSchema: Schema<IEventDocument> = new Schema<IEventDocument>({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  bannerUrl: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });


export default model<IEvent & IEventDocument>('Event', EventSchema);
