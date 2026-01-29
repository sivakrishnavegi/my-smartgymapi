import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

/**
 * UTILITY: Simulate RAG Microservice Completion
 * This script calls the webhook endpoint to update a document's status to 'indexed'.
 */
async function simulateCompletion(ragDocumentId: string) {
    console.log(`--- Simulating RAG Completion for ID: ${ragDocumentId} ---`);

    const webhookUrl = `${API_BASE_URL}/api/webhooks/ai-ingestion`;

    const payload = {
        document_id: ragDocumentId,
        status: "completed",
        vector_ids: [
            `vec_${Math.floor(Math.random() * 1000)}`,
            `vec_${Math.floor(Math.random() * 1000)}`,
            `vec_${Math.floor(Math.random() * 1000)}`
        ]
    };

    try {
        const response = await axios.post(webhookUrl, payload);
        console.log(`✅ SUCCESS: Webhook responded with status ${response.status}`);
        console.log(`Message: ${JSON.stringify(response.data.message)}`);
        console.log(`\nYou can now check the UI or call GET /api/ai-docs to see the "indexed" status.`);
    } catch (error: any) {
        console.error(`❌ FAILURE: Could not trigger webhook.`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data: ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(`Error: ${error.message}`);
        }
    }
}

// Get ID from command line arguments
const argId = process.argv[2];

if (!argId) {
    console.log("Usage: npx ts-node scripts/simulate-rag-completion.ts <ragDocumentId>");
    console.log("\nExample ragDocumentIds from your list:");
    console.log("- ae2949d8-6028-4862-9025-5e53e83dbe68");
    console.log("- d0626eea-9113-42cf-8324-6108afdb3b01");
    console.log("- eef565f5-8bfa-435e-a006-ffcc92b4d918");
    console.log("- f03ad411-219f-4891-bcb0-b676042d1126");
} else {
    simulateCompletion(argId);
}
