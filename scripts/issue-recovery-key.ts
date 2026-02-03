import mongoose from 'mongoose';
import Tenant from '../src/modules/academics/models/tenant.schema';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_SECRET_URI;

if (!MONGODB_URI) {
    console.error("No MONGODB_SECRET_URI found in .env");
    process.exit(1);
}

const run = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("🔥 Connected to MongoDB");

        const targetTenantId = "03254a3f-8c89-4a32-ae74-75e68f8062f1";

        const tenant = await Tenant.findOne({ tenantId: targetTenantId });

        if (!tenant) {
            console.error(`❌ Tenant ${targetTenantId} not found!`);
            process.exit(1);
        }

        console.log(`✅ Found Tenant: ${tenant.name} (${tenant.domain})`);

        // Generate new key
        const keyId = crypto.randomBytes(8).toString("hex");
        const keySecret = crypto.randomBytes(32).toString("hex");
        const keyHash = crypto.createHash("sha256").update(keySecret).digest("hex");
        const rawApiKey = `sk_live_${keyId}_${keySecret}`;

        // Add to tenant
        tenant.apiKeys.push({
            keyHash,
            keySecret: keyId, // Storing keyId as 'keySecret' field per schema convention
            issuedAt: new Date(),
            issuedBy: tenant.apiKeys[0]?.issuedBy, // Reuse existing user if available
            revoked: false
        });

        await tenant.save();

        console.log("\n==================================");
        console.log("   NEW RECOVERY API KEY ISSUED");
        console.log("==================================\n");
        console.log(`Tenant ID: ${targetTenantId}`);
        console.log(`API Key:   ${rawApiKey}`);
        console.log("\nCopy and use this key in your headers!");

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
