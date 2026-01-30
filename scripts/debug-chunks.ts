import { AiDocumentModel } from '../models/AiDocument.model';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Types } from 'mongoose';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function debugChunks() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        // Check documents for the "English" subject mentioned by the user
        // subjectId: "6968f9c90e6b1ae969bffe7f"
        const subjectId = "6968f9c90e6b1ae969bffe7f";

        const docs = await AiDocumentModel.find({
            subjectId: new Types.ObjectId(subjectId),
            isDeleted: false
        }).lean();

        console.log(`Found ${docs.length} documents for subject ${subjectId}`);

        docs.forEach((doc, i) => {
            console.log(`\nDoc ${i + 1}: ${doc.fileName}`);
            console.log(`Status: ${doc.status}`);
            console.log(`vectorIds length: ${doc.vectorIds ? doc.vectorIds.length : 'N/A'}`);
            console.log(`vectorIds content:`, doc.vectorIds);
            console.log(`subjectId type: ${typeof doc.subjectId} - ${doc.subjectId instanceof Types.ObjectId ? 'ObjectId' : 'not ObjectId'}`);
        });

    } catch (error: any) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

debugChunks();
