import { AiDocumentModel } from "@ai/models/AiDocument.model";
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import axios from 'axios';
import { aiConfig } from "@shared/config/ai";

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function verifyFullAiFlow() {
    try {
        console.log("--- Starting Full AI Document Ingestion Flow Verification ---");

        // 1. Connect to MongoDB
        console.log("1. Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        // 2. Simulate the ingestion request results (We'll check the DB since we can't easily do multipart in a simple script without extra deps, but we can verify the DB record creation)
        const mockTenantId = "verified-tenant-" + Date.now();
        const mockRagId = "verified-rag-" + Date.now();

        console.log("\n2. Creating mock document to simulate ingestion start...");
        const doc = new AiDocumentModel({
            tenantId: mockTenantId,
            schoolId: new Types.ObjectId(),
            fileName: "full_flow_test.pdf",
            originalName: "Original.pdf",
            s3Key: `tests/full-flow/${mockRagId}.pdf`,
            ragDocumentId: mockRagId,
            status: "processing",
            metadata: {
                category: "knowledge-base",
                uploadedBy: new Types.ObjectId()
            }
        });
        await doc.save();
        console.log(`✅ SUCCESS: Document created with ragDocumentId: ${mockRagId}`);

        // 3. Trigger Webhook
        console.log("\n3. Triggering webhook to simulate microservice completion...");
        const webhookUrl = `${API_BASE_URL}/api/webhooks/ai-ingestion`;

        try {
            const webhookPayload = {
                document_id: mockRagId,
                status: "completed",
                vector_ids: ["vec-001", "vec-002", "vec-003"]
            };

            const response = await axios.post(webhookUrl, webhookPayload);
            console.log(`✅ SUCCESS: Webhook call returned status ${response.status}`);
        } catch (error: any) {
            console.error("❌ FAILURE: Webhook call failed.");
            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("Data:", error.response.data);
            } else {
                console.error("Message:", error.message);
            }
            throw error;
        }

        // 4. Verify Final Database State
        console.log("\n4. Verifying final database state...");
        const finalDoc = await AiDocumentModel.findOne({ ragDocumentId: mockRagId });

        if (finalDoc) {
            console.log("   - Status:", finalDoc.status);
            console.log("   - Vector IDs Count:", finalDoc.vectorIds.length);

            if (finalDoc.status === "indexed" && finalDoc.vectorIds.length === 3) {
                console.log("\n✅ FULL FLOW VERIFIED: Ingestion -> Webhook -> DB Update completed successfully.");
            } else {
                console.error("\n❌ FLOW VERIFICATION FAILED: Status or Vector IDs mismatch.");
            }
        } else {
            console.error("\n❌ FLOW VERIFICATION FAILED: Document not found in DB.");
        }

        // 5. Cleanup
        await AiDocumentModel.deleteOne({ ragDocumentId: mockRagId });
        console.log("\n5. Cleanup complete.");

    } catch (error: any) {
        console.error("\n❌ CRITICAL VERIFICATION ERROR:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
        process.exit(0);
    }
}

verifyFullAiFlow();
