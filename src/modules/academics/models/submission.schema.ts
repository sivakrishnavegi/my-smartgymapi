import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubmission extends Document {
    assignmentId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    tenantId: string;
    schoolId: mongoose.Types.ObjectId;
    classId: mongoose.Types.ObjectId;
    sectionId: mongoose.Types.ObjectId;
    submissionFile: string[];
    submissionText?: string;
    submittedAt: Date;
    status: 'Submitted' | 'Late' | 'Graded' | 'Returned' | 'Draft' | 'Missing';
    obtainedMarks?: number;
    feedback?: string;
    gradedBy?: mongoose.Types.ObjectId;
    gradedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
    {
        assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
        tenantId: { type: String, required: true },
        schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
        classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
        sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
        submissionFile: [{ type: String }], // Array of file URLs
        submissionText: { type: String },
        submittedAt: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['Submitted', 'Late', 'Graded', 'Returned', 'Draft', 'Missing'],
            default: 'Draft',
        },
        obtainedMarks: { type: Number },
        feedback: { type: String },
        gradedBy: { type: Schema.Types.ObjectId, ref: 'TeacherProfile' },
        gradedAt: { type: Date },
    },
    { timestamps: true }
);

// Indexes
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true }); // One submission per student per assignment
submissionSchema.index({ studentId: 1, status: 1 });
submissionSchema.index({ assignmentId: 1, status: 1 });

export const Submission: Model<ISubmission> = mongoose.model<ISubmission>('Submission', submissionSchema);
