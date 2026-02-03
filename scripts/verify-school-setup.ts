import mongoose from 'mongoose';
import Tenant from '../src/modules/academics/models/tenant.schema';
import School from '../src/modules/academics/models/schools.schema';
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

        // 1. Create a Test Tenant
        const tenantId = `test_tenant_${Date.now()}`;
        const keyId = crypto.randomBytes(8).toString("hex");
        const keySecret = crypto.randomBytes(32).toString("hex");
        const keyHash = crypto.createHash("sha256").update(keySecret).digest("hex");
        const apiKey = `sk_live_${keyId}_${keySecret}`;

        // Create random userObjectId for issuedBy
        const userId = new mongoose.Types.ObjectId();

        const tenant = new Tenant({
            tenantId,
            name: "Test Academy SaaS",
            domain: `test${Date.now()}.local`,
            plan: "pro",
            apiKeys: [{
                keyHash,
                keySecret: keyId,
                issuedAt: new Date(),
                issuedBy: userId,
                revoked: false
            }],
            subscription: {
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                status: "active",
                maxUsers: 10,
                maxStudents: 100
            }
        });
        await tenant.save();
        console.log(`✅ Tenant created: ${tenantId}`);

        // 2. Create a Test School
        const school = new School({
            tenantId,
            name: "Test Primary School",
            academicYears: [],
            createdAt: new Date()
        });
        await school.save();
        console.log(`✅ School created: ${school._id}`);

        console.log("\n==================================");
        console.log("   VERIFICATION CURL COMMANDS");
        console.log("==================================\n");

        const schoolConfigCurl = `curl -X POST http://localhost:3000/api/tenants/school-config \\
  -H "Content-Type: application/json" \\
  -H "x-tenant-id: ${tenantId}" \\
  -H "x-school-id: ${school._id}" \\
  -H "x-api-key: ${apiKey}" \\
  --data-raw '{
    "schoolName": "Elite Global School",
    "logoUrl": "https://example.com/logo.png",
    "affiliationNumber": "CBSE/2024/789",
    "website": "https://eliteglobal.edu",
    "address": "456 Educational Avenue, Knowledge Park",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "contactNumber": "+91 9876543210",
    "email": "info@eliteglobal.edu",
    "adminName": "Dr. Sarah Johnson",
    "adminDesignation": "Director",
    "academicYear": "2024-25",
    "timezone": "Asia/Kolkata",
    "primaryColor": "#6366f1",
    "secondaryColor": "#8b5cf6",
    "agreedToTerms": true
  }'`;

        console.log("# 1. Configure School:");
        console.log(schoolConfigCurl);
        console.log("\n");

        const uploadCurl = `curl -X POST http://localhost:3000/api/s3/upload \\
  -H "x-tenant-id: ${tenantId}" \\
  -H "x-school-id: ${school._id}" \\
  -H "x-api-key: ${apiKey}" \\
  -F "purpose=logo" \\
  -F "file=@./package.json"`;

        console.log("# 2. Upload File (using package.json as dummy):");
        console.log(uploadCurl);
        console.log("\n");

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
