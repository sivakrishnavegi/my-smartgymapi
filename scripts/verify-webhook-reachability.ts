
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

async function verifyWebhook() {
    console.log("--- Verifying Webhook Reachability ---");
    // 1. Try Configured URL
    console.log(`[1] Trying Configured URL: ${API_BASE_URL}/api/webhooks/ai-ingestion`);
    try {
        await axios.post(`${API_BASE_URL}/api/webhooks/ai-ingestion`, {});
        console.log(`✅ SUCCESS: Configured URL is reachable.\n`);
    } catch (error: any) {
        if (error.response) {
            console.log(`✅ SUCCESS: Endpoint reached (Status ${error.response.status}).\n`);
        } else {
            console.error(`❌ FAILURE: Configured URL unreachable.`);
            console.error(`Error: ${error.message}\n`);

            // 2. Try Localhost Fallback (Diagnostic)
            if (!API_BASE_URL.includes("localhost")) {
                console.log(`[2] Diagnostic: Trying http://localhost:3000/api/webhooks/ai-ingestion ...`);
                try {
                    await axios.post(`http://localhost:3000/api/webhooks/ai-ingestion`, {});
                    console.log(`⚠️  DIAGNOSIS: Localhost works, but API_BASE_URL (${API_BASE_URL}) failed.`);
                    console.log(`   -> This confirms your server is running, but the RAG service might need the special URL.`);
                } catch (err) {
                    console.error(`❌ FAILURE: Even localhost is unreachable. Is the server running?`);
                }
            }
        }
    }
}

verifyWebhook();
