import { AiDocumentModel } from '../models/AiDocument.model';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function checkLatestDocs() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const latestDocs = await AiDocumentModel.find({ isDeleted: false })
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean();

        console.log(`\n--- Checking Latest 10 Documents ---`);

        for (let i = 0; i < latestDocs.length; i++) {
            const doc: any = latestDocs[i];
            console.log(`\n[${i + 1}] File: ${doc.fileName}`);
            console.log(`Tenant: ${doc.tenantId}`);
            console.log(`School: ${doc.schoolId}`);
            console.log(`SubjectId: ${doc.subjectId}`);
            console.log(`Status: ${doc.status}`);
            console.log(`Vector Chunks: ${doc.vectorIds ? doc.vectorIds.length : (doc as any).vector_ids ? (doc as any).vector_ids.length : 0}`);
        }

    } catch (error: any) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkLatestDocs();
