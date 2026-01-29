
import { AiDocumentService } from '../services/aiDocumentService';
import { aiConfig } from '../config/ai';
import dotenv from 'dotenv';
dotenv.config();

console.log("Loaded aiConfig:", JSON.stringify(aiConfig, null, 2));

// Mongoose stub/mock connection is NOT needed because getRagStatus implies pure axios call?
// Wait, AiDocumentService imports AiDocumentModel, so we might need database connection or mock?
// Actually getRagStatus is a pure axios call and doesn't touch Mongo.
// Using ts-node might try to compile the whole file which imports Mongoose. 
// Ideally we should just run it.

const ragDocumentId = "3af006c7-c8aa-49dd-811d-5616dd10806c";
const tenantId = "03254a3f-8c89-4a32-ae74-75e68f8062f1";
const schoolId = "68a92f1ca69d89189e2f6df6";

async function test() {
    console.log("Testing getRagStatus with IDs from user report...");
    try {
        const result = await AiDocumentService.getRagStatus(ragDocumentId, tenantId, schoolId);
        console.log("✅ Success! Result:", result);
    } catch (error: any) {
        console.error("❌ Failed:", error.response?.data || error.message);
    }
}

test();
