import dotenv from "dotenv";
dotenv.config();

import { AwsService } from "../services/awsService";

async function verifyS3Flow() {
    try {
        console.log("--- Starting AWS S3 System Verification ---");

        // 1. Verify Configuration
        console.log("Bucket Name:", process.env.AMPLIFY_BUCKET || "MISSING");
        console.log("Region:", process.env.AWS_REGION || "ap-south-1");
        console.log("Access Key ID Present:", !!process.env.AWS_ACCESS_KEY_ID);
        console.log("Secret Access Key Present:", !!process.env.AWS_SECRET_ACCESS_KEY);

        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.warn("⚠️ AWS Credentials missing from .env. Checking DEV versions...");
            if (process.env.AWS_ACCESS_KEY_DEV_ID && process.env.AWS_SECRET_ACCESS_DEV_KEY) {
                console.log("Found DEV credentials. Overriding...");
                process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_DEV_ID;
                process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_DEV_KEY;
            } else {
                throw new Error("AWS Credentials missing from .env");
            }
        }

        // 2. Test Pre-signed URL generation
        console.log("\n[TEST 1] Generating a pre-signed URL...");
        const testKey = `test-upload-${Date.now()}.txt`;
        const url = await AwsService.getPresignedUrl(testKey, "text/plain");

        if (url && url.startsWith("https://")) {
            console.log(`✅ SUCCESS: Pre-signed URL generated: ${url.substring(0, 50)}...`);
        } else {
            console.error("❌ FAILURE: Pre-signed URL generation failed.");
        }

        // 3. Test File Listing
        console.log("\n[TEST 2] Listing files in the bucket...");
        const list = await AwsService.listFiles();
        console.log(`✅ SUCCESS: Bucket listed. Found ${list.Contents?.length || 0} items.`);

        // 4. Test File Verification (Negative)
        console.log("\n[TEST 3] Verifying existence of a non-existent file...");
        const exists = await AwsService.checkFileExists(`non-existent-${Date.now()}`);
        if (!exists) {
            console.log("✅ SUCCESS: Correctly identified file as non-existent.");
        } else {
            console.error("❌ FAILURE: Incorrectly identified file as existing.");
        }

        console.log("\n--- Verification Complete ---");
    } catch (error: any) {
        console.error("❌ Unexpected Error:", error.message);
    } finally {
        process.exit(0);
    }
}

verifyS3Flow();
