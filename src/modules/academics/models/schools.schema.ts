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
  schoolName?: string;
  logoUrl?: string;
  affiliationNumber?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactNumber?: string;
  email?: string;
  adminName?: string;
  adminDesignation?: string;
  academicYear?: string;
  timezone?: string;
  primaryColor?: string;
  secondaryColor?: string;
  agreedToTerms?: boolean;
  contact?: IContact;
  academicYears: IAcademicYear[];
  settings?: Record<string, any>;
  createdAt: Date;
}

const SchoolSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  name: String,
  schoolName: String,
  logoUrl: String,
  affiliationNumber: String,
  website: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  contactNumber: String,
  email: String,
  adminName: String,
  adminDesignation: String,
  academicYear: String,
  timezone: String,
  primaryColor: String,
  secondaryColor: String,
  agreedToTerms: { type: Boolean, default: false },
  contact: { phone: String, email: String },
  academicYears: [{
    yearId: String,
    start: Date,
    end: Date,
    status: { type: String, enum: ['active', 'archived'] }
  }],
  settings: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISchool>('School', SchoolSchema);
