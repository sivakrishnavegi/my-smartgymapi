import { Document, Types } from "mongoose";

export interface ISection extends Document {
  tenantId: string;
  schoolId: Types.ObjectId;
  sectionName: string;  
  sectionCode : string;   
  description : string;      
  isActive : boolean;  
  homeroomTeacherId?: Types.ObjectId;
  createdAt: Date;
  createdBy? : Types.ObjectId;
}
