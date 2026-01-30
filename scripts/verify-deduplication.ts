import { AiDocumentService } from '../services/aiDocumentService';
import { AiDocumentModel } from '../models/AiDocument.model';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import crypto from 'crypto';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function verifyDeduplication() {
    try {
        console.log("--- Starting AI Document Deduplication Verification ---");

        // 1. Connect to MongoDB
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const tenantId = "dedup-tenant-" + Date.now();
        const fileContent = Buffer.from("This is some test content for deduplication hashing.");
        const contentHash = crypto.createHash("sha256").update(fileContent).digest("hex");
        const ragId = "rag-id-" + Date.now();

        // 2. Mock a successfully indexed document
        console.log("\n1. Mocking an indexed document with content hash...");
        const initialDoc = new AiDocumentModel({
            tenantId,
            schoolId: new Types.ObjectId(),
            fileName: "original_file.pdf",
            originalName: "original_file.pdf",
            s3Key: "path/to/original.pdf",
            status: "indexed",
            contentHash,
            ragDocumentId: ragId,
            vectorIds: ["vec-1", "vec-2"],
            metadata: { uploadedBy: new Types.ObjectId() }
        });
        await initialDoc.save();
        console.log(`✅ SUCCESS: Mock document created with hash: ${contentHash}`);

        // 3. Test findExistingDuplicate
        console.log("\n2. Testing service.findExistingDuplicate...");
        const duplicate = await AiDocumentService.findExistingDuplicate(tenantId, contentHash);

        if (duplicate && duplicate.ragDocumentId === ragId) {
            console.log("✅ SUCCESS: Found existing duplicate correctly.");
        } else {
            console.error("❌ FAILURE: Could not find existing duplicate.");
            process.exit(1);
        }

        // 4. Test with different content (hash mismatch)
        console.log("\n3. Testing service.findExistingDuplicate with different hash...");
        const diffHash = crypto.createHash("sha256").update("different content").digest("hex");
        const noMatch = await AiDocumentService.findExistingDuplicate(tenantId, diffHash);

        if (!noMatch) {
            console.log("✅ SUCCESS: No match found for different content.");
        } else {
            console.error("❌ FAILURE: Incorrectly matched different content.");
            process.exit(1);
        }

        console.log("\n--- Verification Complete ---");

    } catch (error: any) {
        console.error("❌ Unexpected Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyDeduplication();
