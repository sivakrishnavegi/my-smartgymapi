import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/ds';
import { chatWithAi } from '../controllers/aiTeacherController';
import { AiChatHistoryModel } from '../models/aiChatHistory.model';
import { Request, Response } from 'express';

const run = async () => {
    try {
        await connectDB();
        console.log("DB Connected");

        // Mock User
        const userId = new mongoose.Types.ObjectId();
        const tenantId = "verify-tenant-history";
        const schoolId = new mongoose.Types.ObjectId();

        const req = {
            body: { message: "What is history?", subjectId: "hist-101" },
            user: {
                _id: userId,
                userType: "student",
                enrollment: { classId: new mongoose.Types.ObjectId(), sectionId: new mongoose.Types.ObjectId() },
                tenantId,
                schoolId
            }
        } as unknown as Request;

        const res = {
            status: (code: number) => ({ json: (d: any) => console.log("Status:", code, "Data:", JSON.stringify(d)) }),
            json: (d: any) => console.log("Data:", JSON.stringify(d))
        } as unknown as Response;

        console.log("Sending Chat Request...");
        // This will try to use Real Redis if imported. 
        // If Redis fails, the controller catches error. 
        // We hope it degrades gracefully or we have redis running (which previous scripts showed we do).
        await chatWithAi(req, res);

        console.log("Checking MongoDB...");
        const history = await AiChatHistoryModel.findOne({ tenantId, userId });

        if (history) {
            console.log("✅ SUCCESS: Chat History found in MongoDB!");
            console.log("Session ID:", history.sessionId);
            console.log("Messages Count:", history.messages.length);
            console.log("Title:", history.title);
        } else {
            console.error("❌ FAILURE: Chat History NOT found in MongoDB.");
        }

        // Cleanup
        if (history) await AiChatHistoryModel.deleteOne({ _id: history._id });

    } catch (e) {
        console.error("Verification Failed:", e);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

run();
