import { Document, Types } from "mongoose";

export interface IClass extends Document {
  tenantId: string;               
  schoolId: Types.ObjectId;        
  name: string;                   
  code?: string;                  
  description?: string;           
  academicSession?: string;       
  medium?: string;                 
  shift?: "Morning" | "Evening";  
  sections?: Types.ObjectId[];     
  classTeacher?: Types.ObjectId;   
  status: "Active" | "Inactive";  
  createdBy?: Types.ObjectId;     
  updatedBy?: Types.ObjectId;      
  createdAt: Date;
  updatedAt: Date;
}