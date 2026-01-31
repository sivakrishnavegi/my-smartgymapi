import mongoose, { Schema } from 'mongoose';

export interface IContact {
  phone?: string;
  email?: string;
}

export interface IAcademicYear {
  yearId: string;
  start: Date;
  end: Date;
  status: "active" | "archived";
}

export interface ISchool extends Document {
  tenantId: string;
  name?: string;
  address?: string;
  contact?: IContact;
  academicYears: IAcademicYear[];
  settings?: Record<string, any>;  
  createdAt: Date;
}

const SchoolSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  name: String,
  address: String,
  contact: { phone: String, email: String },
  academicYears: [{
    yearId: String,
    start: Date,
    end: Date,
    status: { type: String, enum: ['active','archived'] }
  }],
  settings: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISchool>('School', SchoolSchema);
