
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/ds';
import { SectionModel } from '@academics/models/section.model';
import { ClassModel } from '@academics/models/class.model';
import { checkSectionAlignment } from '@academics/controllers/sectionController';
import mongoose from 'mongoose';
import { Request, Response } from 'express';

const run = async () => {
    try {
        await connectDB();
        console.log("DB Connected");

        const tenantId = "verify-pagination-tenant";
        const schoolId = new mongoose.Types.ObjectId().toString(); // Use string for consistency with controller check
        const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

        // 1. Create Section
        console.log("Creating Section...");
        const section = await SectionModel.create({
            tenantId,
            schoolId: schoolObjectId,
            sectionName: "Verify Section A",
            sectionCode: `SEC-${Date.now()}`,
            isActive: true,
            createdBy: new mongoose.Types.ObjectId()
        });
        const sectionId = (section as any)._id.toString();
        console.log("Section Created:", sectionId);

        // 2. Mock Request/Response for Unassigned Check
        console.log("Testing Check (Unassigned)...");
        let req = {
            params: { sectionId },
            query: { tenantId, schoolId }
        } as unknown as Request;

        let res = {
            status: (code: number) => {
                console.log(`Status: ${code}`);
                return {
                    json: (body: any) => {
                        console.log("Response:", JSON.stringify(body, null, 2));
                        if (body.data.isAligned !== false) throw new Error("Should be unaligned");
                    }
                };
            }
        } as unknown as Response;

        await checkSectionAlignment(req, res);

        // 3. Create Class & Assign
        console.log("Creating Class & Assigning...");
        const cls = await ClassModel.create({
            tenantId,
            schoolId: schoolObjectId,
            name: "Verify Class 1",
            code: `CLS-${Date.now()}`,
            sections: [section._id],
            academicSession: "2024-2025"
        });
        console.log("Class Created:", cls._id);

        // 4. Mock Request/Response for Assigned Check
        console.log("Testing Check (Assigned)...");
        req = {
            params: { sectionId },
            query: { tenantId, schoolId }
        } as unknown as Request;

        res = {
            status: (code: number) => {
                console.log(`Status: ${code}`);
                return {
                    json: (body: any) => {
                        console.log("Response:", JSON.stringify(body, null, 2));
                        if (body.data.isAligned !== true) throw new Error("Should be aligned");
                        if (body.data.class.name !== "Verify Class 1") throw new Error("Wrong class name");
                    }
                };
            }
        } as unknown as Response;

        await checkSectionAlignment(req, res);

        // Clean up
        console.log("Cleaning up...");
        await SectionModel.deleteOne({ _id: section._id });
        await ClassModel.deleteOne({ _id: cls._id });
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
