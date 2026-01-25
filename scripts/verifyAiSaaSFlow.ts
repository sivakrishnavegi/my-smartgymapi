
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/ds';
import { AiChatHistoryModel } from '../models/aiChatHistory.model';
import { AiConfigModel } from '../models/AiConfig';
import { askAi } from '../controllers/aiTeacherController';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

const run = async () => {
    try {
        await connectDB();
        console.log("DB Connected");

        const tenantId = "verify-ai-saas-tenant";
        const schoolObjectId = new mongoose.Types.ObjectId();
        const schoolId = schoolObjectId.toString();
        const userId = new mongoose.Types.ObjectId();

        // 1. Create AiConfig (Initially Disabled)
        console.log("Creating AiConfig (Disabled)...");
        await AiConfigModel.create({
            tenantId,
            schoolId: schoolObjectId,
            isEnabled: false,
            tokenManagement: {
                monthlyLimit: 1000,
                usedThisMonth: 0,
                totalUsed: 0,
                lastResetDate: new Date()
            }
        });

        const mockUser = {
            id: userId.toString(),
            role: "student",
            tenantId,
            schoolId
        };

        const req = {
            body: {
                subject: "biology",
                input: { type: "text", content: "Test message" },
                tenantId,
                schoolId
            },
            user: mockUser
        } as unknown as Request;

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

        // Test 1: Disabled
        console.log("Testing askAi (Disabled)...");
        await askAi(req, res);
        if (lastStatus !== 403) throw new Error(`Expected 403 when disabled, got ${lastStatus}`);
        console.log("✅ Correctly rejected disabled school");

        // Test 2: Enabled
        console.log("Enabling AI and Testing...");
        await AiConfigModel.updateOne({ tenantId, schoolId }, { isEnabled: true });
        await askAi(req, res);
        if (lastStatus !== 200) throw new Error(`Expected 200 when enabled, got ${lastStatus}`);
        if (!lastBody.success) throw new Error(`Expected success: true, got ${JSON.stringify(lastBody)}`);

        // Verify token deduction
        const configAfter = await AiConfigModel.findOne({ tenantId, schoolId });
        if (configAfter?.tokenManagement.usedThisMonth !== 500) {
            throw new Error(`Expected 500 tokens used, got ${configAfter?.tokenManagement.usedThisMonth}`);
        }
        console.log("✅ Correctly processed request and deducted tokens");

        // Test 3: Token Limit Reached
        console.log("Simulating Token Limit Reached...");
        await AiConfigModel.updateOne({ tenantId, schoolId }, { "tokenManagement.usedThisMonth": 1000 });
        await askAi(req, res);
        if (lastStatus !== 403) throw new Error(`Expected 403 when limit reached, got ${lastStatus}`);
        if (!lastBody.message.includes("limit reached")) throw new Error("Expected limit reached message");
        console.log("✅ Correctly rejected when limit reached");

        // Clean up
        console.log("Cleaning up...");
        await AiConfigModel.deleteOne({ tenantId, schoolId });
        await AiChatHistoryModel.deleteMany({ tenantId, schoolId });
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
