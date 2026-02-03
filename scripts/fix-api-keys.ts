import mongoose from 'mongoose';
import Tenant from '../src/modules/academics/models/tenant.schema';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_SECRET_URI;
const FALLBACK_USER_ID = "68abcba375247cc266808bcc"; // Valid admin/teacher ID

if (!MONGODB_URI) {
    console.error("No MONGODB_SECRET_URI found in .env");
    process.exit(1);
}

const run = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("🔥 Connected to MongoDB");

        const tenants = await Tenant.find({});
        console.log(`Found ${tenants.length} tenants. Checking for missing issuedBy...`);

        for (const tenant of tenants) {
            let modified = false;
            for (const key of tenant.apiKeys) {
                if (!key.issuedBy) {
                    // @ts-ignore
                    key.issuedBy = new mongoose.Types.ObjectId(FALLBACK_USER_ID);
                    modified = true;
                }
            }

            if (modified) {
                await tenant.save();
                console.log(`✅ Updated keys for tenant: ${tenant.name} (${tenant.tenantId})`);
            }
        }

        console.log("Done!");

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
