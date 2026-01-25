
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/ds';
import { AiConfigModel } from '../models/AiConfig';
import { updateAiConfiguration, getAiConfiguration } from '../controllers/aiTeacherController';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

const run = async () => {
    try {
        await connectDB();
        console.log("DB Connected");

        const tenantId = "verify-ai-config-tenant";
        const schoolObjectId = new mongoose.Types.ObjectId();
        const schoolId = schoolObjectId.toString();
        const userId = new mongoose.Types.ObjectId();

        const mockUser = {
            id: userId.toString(),
            role: "admin",
            tenantId,
            schoolId
        };

        let lastStatus: any = 0;
        let lastBody: any = null;

        const res = {
            status: (code: number) => {
                lastStatus = code;
                return {
                    json: (body: any) => {
                        lastBody = body;
                    }
                };
            }
        } as unknown as Response;

        // Test 1: Create Configuration (Upsert via Body)
        console.log("Testing updateAiConfiguration (Create via Body)...");
        const createReq = {
            body: {
                tenantId,
                schoolId,
                isEnabled: true,
                subscription: { tier: "premium", expiresAt: new Date(Date.now() + 86400000) },
                tokenManagement: { monthlyLimit: 50000 },
                config: { modelVendor: "openai", temperature: 0.5 }
            },
            user: mockUser
        } as unknown as Request;

        await updateAiConfiguration(createReq, res);
        if (lastStatus !== 200) throw new Error(`Expected 200, got ${lastStatus}`);
        if (!lastBody.success) throw new Error("Expected success: true");
        console.log("✅ Correctly created new configuration with explicit body IDs");

        // Test 2: Update Configuration (Upsert via Body)
        console.log("Testing updateAiConfiguration (Update via Body)...");
        const updateReq = {
            body: {
                tenantId,
                schoolId,
                isEnabled: false,
                config: { modelVendor: "anthropic", temperature: 0.8 }
            },
            user: mockUser
        } as unknown as Request;

        await updateAiConfiguration(updateReq, res);
        const updatedDoc = await AiConfigModel.findOne({ tenantId, schoolId });
        if (updatedDoc?.isEnabled !== false) throw new Error("IsEnabled was not updated");
        console.log("✅ Correctly updated configuration with explicit body IDs");

        // Test 3: Get Configuration (via Query Params)
        console.log("Testing getAiConfiguration (via Query)...");
        const getReq = {
            query: { tenantId, schoolId },
            user: mockUser
        } as unknown as Request;
        await getAiConfiguration(getReq, res);
        if (lastStatus !== 200) throw new Error(`Expected 200, got ${lastStatus}`);
        if (lastBody.data.config.modelVendor !== "anthropic") throw new Error("Fetched config mismatch");
        console.log("✅ Correctly fetched configuration with explicit query IDs");

        // Test 4: Security (Unauthorized Tenant)
        console.log("Testing Security (Unauthorized Tenant)...");
        const badReq = {
            query: { tenantId: "wrong-tenant", schoolId },
            user: mockUser
        } as unknown as Request;
        await getAiConfiguration(badReq, res);
        if (lastStatus !== 403) throw new Error(`Expected 403 for unauthorized tenant, got ${lastStatus}`);
        console.log("✅ Correctly blocked unauthorized tenant access");

        // Clean up
        console.log("Cleaning up...");
        await AiConfigModel.deleteOne({ tenantId, schoolId });
        console.log("Clean up done.");

    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

run();
