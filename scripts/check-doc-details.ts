import { AiDocumentModel } from '../models/AiDocument.model';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function checkDocDetails() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const doc: any = await AiDocumentModel.findOne({ fileName: "englsh" }).lean();

        if (doc) {
            console.log(`\n--- Document Details: ${doc.fileName} ---`);
            console.log(`Status: ${doc.status}`);
            console.log(`RAG Document ID: ${doc.ragDocumentId}`);
            console.log(`Vector IDs:`, doc.vectorIds);
            console.log(`Metadata:`, JSON.stringify(doc.metadata, null, 2));
            console.log(`Content length: ${doc.content ? doc.content.length : 0}`);
            console.log(`Created At: ${doc.createdAt}`);
            console.log(`Updated At: ${doc.updatedAt}`);
        } else {
            console.log("Document 'englsh' not found.");
        }

    } catch (error: any) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkDocDetails();
