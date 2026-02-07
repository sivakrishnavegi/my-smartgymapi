import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAssignment extends Document {
    tenantId: string;
    schoolId: mongoose.Types.ObjectId;
    classId: mongoose.Types.ObjectId;
    sectionId: mongoose.Types.ObjectId;
    subjectId?: mongoose.Types.ObjectId;
    teacherId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    dueDate: Date;
    maxMarks: number;
    attachments: string[];
    status: 'Draft' | 'Published' | 'Archived';
    submissionType: 'File' | 'Text' | 'Both';
    createdAt: Date;
    updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
    {
        tenantId: { type: String, required: true },
        schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
        classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
        sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
        subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' }, // Optional
        teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile', required: true },
        title: { type: String, required: true },
        description: { type: String },
        dueDate: { type: Date, required: true },
        maxMarks: { type: Number, required: true },
        attachments: [{ type: String }],
        status: {
            type: String,
            enum: ['Draft', 'Published', 'Archived'],
            default: 'Draft',
        },
        submissionType: {
            type: String,
            enum: ['File', 'Text', 'Both'],
            default: 'File',
        },
    },
    { timestamps: true }
);

// Indexes for common queries
assignmentSchema.index({ tenantId: 1, schoolId: 1, classId: 1, sectionId: 1 });
assignmentSchema.index({ teacherId: 1 });

export const Assignment: Model<IAssignment> = mongoose.model<IAssignment>('Assignment', assignmentSchema);
