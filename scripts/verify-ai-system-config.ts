
import { AiConfigModel } from '../models/AiConfig';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import '../models/users.schema';
import '../models/schools.schema';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function verifySystemConfig() {
    try {
        console.log("--- Starting AI System Config Security Verification ---");

        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const tenantId = "sys-config-test-" + Date.now();
        const schoolId = new Types.ObjectId();

        // 1. Setup Initial State (Free Tier)
        console.log(`\n[TEST 1] Creating Initial Config (Free Tier)...`);
        const initialConfig = new AiConfigModel({
            tenantId,
            schoolId,
            isEnabled: true,
            subscription: { tier: "free" },
            config: { defaultModel: "gpt-3.5-turbo", temperature: 0.7 }
        });
        await initialConfig.save();
        console.log(`✅ Created config: Tier=${initialConfig.subscription.tier}, Enabled=${initialConfig.isEnabled}`);

        // 2. Simulate User Attempting to Upgrade to Premium via API
        console.log(`\n[TEST 2] Simulating Malicious Update Request (Attempting Free -> Premium)...`);

        // Mock Request Body
        const reqBody = {
            isEnabled: false, // User changing Availability
            subscription: { tier: "premium" }, // MALICIOUS ATTEMPT
            tokenManagement: { monthlyLimit: 9999999 }, // MALICIOUS ATTEMPT
            config: { defaultModel: "gpt-4", temperature: 0.5 } // User changing Model
        };

        // --- SIMULATING CONTROLLER LOGIC START ---
        const updateData: any = {
            updatedAt: new Date()
        };

        if (typeof reqBody.isEnabled === 'boolean') {
            updateData.isEnabled = reqBody.isEnabled;
        }

        if (reqBody.config) {
            // Validate temperature
            if (typeof reqBody.config.temperature === 'number') {
                if (reqBody.config.temperature < 0 || reqBody.config.temperature > 1) {
                    throw new Error("Temperature validation failed");
                }
            }
            updateData.config = reqBody.config;
        }
        // Note: We intentionally DO NOT map subscription or tokenManagement
        // --- SIMULATING CONTROLLER LOGIC END ---

        const updatedConfig = await AiConfigModel.findOneAndUpdate(
            { tenantId, schoolId },
            { $set: updateData },
            { new: true }
        );

        if (!updatedConfig) throw new Error("Update failed, config null");

        // 3. Verify Results
        console.log(`\n[TEST 3] Verifying Security...`);

        // Check Enabled (Should verify change)
        if (updatedConfig.isEnabled === false) {
            console.log(`✅ SUCCESS: 'isEnabled' updated correctly.`);
        } else {
            console.error(`❌ FAILURE: 'isEnabled' did not update.`);
        }

        // Check Config (Should verify change)
        if (updatedConfig.config.defaultModel === "gpt-4") {
            console.log(`✅ SUCCESS: 'config.defaultModel' updated correctly.`);
        } else {
            console.error(`❌ FAILURE: 'config.defaultModel' did not update.`);
        }

        // Check Subscription (Should REMAIN Free)
        if (updatedConfig.subscription.tier === "free") {
            console.log(`✅ SUCCESS: 'subscription.tier' was PROTECTED (remained 'free').`);
        } else {
            console.error(`❌ FAILURE: 'subscription.tier' was improperly updated to ${updatedConfig.subscription.tier}.`);
        }

        // Check Token Limit (Should REMAIN Default/Initial)
        if (updatedConfig.tokenManagement.monthlyLimit === 100000) { // Default from schema
            console.log(`✅ SUCCESS: 'tokenManagement.monthlyLimit' was PROTECTED.`);
        } else {
            console.error(`❌ FAILURE: 'tokenManagement.monthlyLimit' was improperly updated.`);
        }

        console.log("\n--- Verification Complete ---");

    } catch (error: any) {
        console.error("❌ Unexpected Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifySystemConfig();
