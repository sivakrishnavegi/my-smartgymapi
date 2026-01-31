
import { AiGovernanceConfigModel } from '../models/AiGovernanceConfig.model';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import { AiConfigModel } from '../models/AiConfig';
import '../models/users.schema';
import '../models/schools.schema';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function verifyGovernance() {
    try {
        console.log("--- Starting AI Governance Verification ---");

        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const tenantId = "gov-test-tenant-" + Date.now();
        const schoolId = new Types.ObjectId();

        console.log(`\n[TEST 1] Creating Default Governance Config...`);
        const config = new AiGovernanceConfigModel({
            tenantId,
            schoolId
        });
        await config.save();
        console.log(`✅ Created config with ID: ${config._id}`);
        console.log(`   Global Prompt: ${config.globalSystemPrompt}`);
        console.log(`   Default Style: ${config.teachingStyles.find(s => s.isDefault)?.name}`);

        console.log(`\n[TEST 2] Updating Governance Config...`);
        config.safetyGuardrails.forbiddenKeywords.push("badword");
        config.teachingStyles.push({
            id: "pirate",
            name: "Pirate Mode",
            prompt: "Speak like a pirate.",
            isDefault: false
        });
        await config.save();
        console.log(`✅ Updated config. Keywords: ${config.safetyGuardrails.forbiddenKeywords}`);

        console.log(`\n[TEST 3] Verifying Logic Retrieval (Simulating Controller)...`);
        const retrieved = await AiGovernanceConfigModel.findOne({ tenantId, schoolId });

        if (!retrieved) throw new Error("Could not retrieve config");

        const pirateStyle = retrieved.teachingStyles.find(s => s.id === "pirate");
        if (pirateStyle) {
            console.log(`✅ Found custom style: ${pirateStyle.name}`);
        } else {
            console.error(`❌ Failed to find custom style`);
        }

        console.log("\n--- Verification Complete ---");

    } catch (error: any) {
        console.error("❌ Unexpected Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyGovernance();
