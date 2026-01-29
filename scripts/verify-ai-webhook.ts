import { AiDocumentModel } from '../models/AiDocument.model';
import { aiIngestionWebhook } from '../controllers/aiWebhookController';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import { Request, Response } from 'express';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function verifyWebhookFlow() {
    try {
        console.log("--- Starting AI Ingestion Webhook Verification ---");

        // 1. Connect to MongoDB
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        // 2. Create a dummy document with a ragDocumentId
        const ragId = `mock-rag-${Date.now()}`;
        const testDoc = new AiDocumentModel({
            tenantId: "test-tenant-webhook",
            schoolId: new Types.ObjectId(),
            fileName: "webhook_test.pdf",
            originalName: "Original.pdf",
            s3Key: `tests/${ragId}.pdf`,
            ragDocumentId: ragId,
            status: "processing",
            metadata: { uploadedBy: new Types.ObjectId() }
        });
        await testDoc.save();
        console.log(`✅ SUCCESS: Created test document with RAG ID: ${ragId}`);

        // 3. Mock Webhook Request
        console.log("\n[TEST 1] Triggering Webhook for 'completed' status...");
        const req = {
            body: {
                document_id: ragId,
                status: "completed",
                vector_ids: ["v1", "v2", "v3"]
            }
        } as Partial<Request>;

        const res = {
            status: (code: number) => ({
                json: (data: any) => {
                    console.log(`Webhook responded with status ${code}:`, data);
                    return res;
                }
            })
        } as any;

        await aiIngestionWebhook(req as Request, res as Response);

        // 4. Verify DB Update
        const updatedDoc = await AiDocumentModel.findOne({ ragDocumentId: ragId });
        if (updatedDoc?.status === "indexed" && updatedDoc.vectorIds.length === 3) {
            console.log("✅ SUCCESS: Document status updated to 'indexed' and vector IDs stored.");
        } else {
            console.error("❌ FAILURE: Document update failed.");
        }

        // 5. Cleanup
        await AiDocumentModel.deleteOne({ ragDocumentId: ragId });
        console.log("\n--- Verification Complete ---");

    } catch (error: any) {
        console.error("❌ Unexpected Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyWebhookFlow();
