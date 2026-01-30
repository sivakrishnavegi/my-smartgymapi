import { AiDocumentModel } from '../models/AiDocument.model';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function checkIngestionErrors() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const doc: any = await AiDocumentModel.findOne({ fileName: "phsycology" }).lean();

        if (doc) {
            console.log(`\nFound doc: ${doc.fileName}`);
            console.log(`Status: ${doc.status}`);
            console.log(`Vector IDs:`, doc.vectorIds);
            console.log(`Metadata:`, JSON.stringify(doc.metadata, null, 2));
            console.log(`RAG ID: ${doc.ragDocumentId}`);
        } else {
            console.log("Document not found.");
        }

    } catch (error: any) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkIngestionErrors();
