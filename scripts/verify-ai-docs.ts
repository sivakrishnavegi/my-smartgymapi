import { AiDocumentService } from '../services/aiDocumentService';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import '../models/class.model';
import '../models/section.model';
import '../models/subject.model';
import '../models/schools.schema';
import '../models/users.schema';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function verifyDocumentFlow() {
    try {
        console.log("--- Starting AI Document System Verification ---");

        // 1. Connect to MongoDB
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const testData = {
            tenantId: "test-tenant-123",
            schoolId: new Types.ObjectId().toString(),
            classId: new Types.ObjectId().toString(),
            sectionId: new Types.ObjectId().toString(),
            fileName: "syllabus_2026.pdf",
            originalName: "Original Syllabus.pdf",
            s3Key: `uploads/test-tenant-123/syllabus_${Date.now()}.pdf`,
            fileType: "application/pdf",
            fileSize: 1024 * 50,
            uploadedBy: new Types.ObjectId().toString(),
        };

        // 2. Test Registration
        console.log("\n[TEST 1] Registering a new document...");
        const doc = await AiDocumentService.registerDocument(testData);
        console.log(`✅ SUCCESS: Document registered with ID: ${doc._id}`);

        // 3. Test Retrieval with Hierarchy
        console.log("\n[TEST 2] Fetching documents for the school/section...");
        const { documents: docs } = await AiDocumentService.getDocuments({
            tenantId: testData.tenantId,
            schoolId: testData.schoolId,
            sectionId: testData.sectionId,
        });

        if (docs.length > 0 && docs[0].fileName === testData.fileName) {
            console.log(`✅ SUCCESS: Retrieved ${docs.length} documents correctly filtered.`);
        } else {
            console.error("❌ FAILURE: Document retrieval failed or filters not working.");
        }

        // 4. Test Status Update
        console.log("\n[TEST 3] Updating document status to 'indexed'...");
        const updatedDoc = await AiDocumentService.updateStatus(
            (doc._id as any).toString(),
            "indexed",
            ["vector_1", "vector_2"]
        );

        if (updatedDoc?.status === "indexed" && updatedDoc.vectorIds.length === 2) {
            console.log("✅ SUCCESS: Document status and vector IDs updated.");
        } else {
            console.error("❌ FAILURE: Status update failed.");
        }

        // 5. Test Soft Delete
        console.log("\n[TEST 4] Deleting document...");
        await AiDocumentService.deleteDocument((doc._id as any).toString());
        const { documents: remainingDocs } = await AiDocumentService.getDocuments({
            tenantId: testData.tenantId,
        });

        const isStillVisible = remainingDocs.some(d => (d as any)._id.toString() === (doc as any)._id.toString());
        if (!isStillVisible) {
            console.log("✅ SUCCESS: Document soft-deleted correctly (not returned in list).");
        } else {
            console.error("❌ FAILURE: Soft delete failed, document still visible.");
        }

        console.log("\n--- Verification Complete ---");

    } catch (error: any) {
        console.error("❌ Unexpected Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyDocumentFlow();
