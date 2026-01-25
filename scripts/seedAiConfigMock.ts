
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/ds';
import { AiConfigModel } from '../models/AiConfig';
import mongoose from 'mongoose';

const seed = async () => {
    try {
        await connectDB();
        console.log("DB Connected");

        const tenantId = "03254a3f-8c89-4a32-ae74-75e68f8062f1";
        const schoolId = "68a92f1ca69d89189e2f6df6";

        console.log(`Seeding AI Config for Tenant: ${tenantId}, School: ${schoolId}...`);

        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        const aiConfig = await AiConfigModel.findOneAndUpdate(
            { tenantId, schoolId: new mongoose.Types.ObjectId(schoolId) },
            {
                $set: {
                    isEnabled: true,
                    subscription: {
                        tier: "premium",
                        expiresAt: oneYearFromNow
                    },
                    tokenManagement: {
                        monthlyLimit: 5000,
                        usedThisMonth: 0,
                        totalUsed: 0,
                        lastResetDate: new Date()
                    },
                    config: {
                        modelVendor: "openai",
                        defaultModel: "gpt-4o",
                        temperature: 0.7
                    }
                }
            },
            { upsert: true, new: true }
        );

        console.log("✅ AI Configuration seeded successfully:");
        console.log(JSON.stringify(aiConfig, null, 2));

    } catch (error) {
        console.error("Seeding Failed:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

seed();
