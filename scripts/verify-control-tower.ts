import { getControlTowerList, toggleSubjectAi } from '../services/aiSubjectService';
import { SubjectModel } from '../models/subject.model';
import { AiDocumentModel } from '../models/AiDocument.model';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Types } from 'mongoose';

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/my-gym-db";

async function verifyControlTower() {
    try {
        console.log("--- Starting AI Control Tower Verification ---");

        // 1. Connect to MongoDB
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const tenantId = "ct-tenant-" + Date.now();
        const schoolId = new Types.ObjectId();

        // 2. Setup Mock Data
        console.log("\n1. Creating mock subject and indexed documents...");
        const subject = new SubjectModel({
            tenantId,
            schoolId,
            classId: new Types.ObjectId(),
            sectionId: new Types.ObjectId(),
            name: "Advanced Physics",
            code: "PHYS-101"
        });
        await subject.save();

        const doc1 = new AiDocumentModel({
            tenantId,
            schoolId,
            subjectId: subject._id,
            fileName: "physics_notes_1.pdf",
            originalName: "physics_notes_1.pdf",
            s3Key: "key-" + Date.now() + "1",
            status: "indexed",
            vectorIds: ["v1", "v2", "v3"], // 3 chunks
            metadata: { uploadedBy: new Types.ObjectId() }
        });
        const doc2 = new AiDocumentModel({
            tenantId,
            schoolId,
            subjectId: subject._id,
            fileName: "physics_notes_2.pdf",
            originalName: "physics_notes_2.pdf",
            s3Key: "key-" + Date.now() + "2",
            status: "indexed",
            vectorIds: ["v4", "v5"], // 2 chunks
            metadata: { uploadedBy: new Types.ObjectId() }
        });
        await doc1.save();
        await doc2.save();
        console.log("✅ SUCCESS: Mock data created.");

        // 3. Test Control Tower List (Aggregated)
        console.log("\n2. Testing getControlTowerList aggregation...");
        const response = await getControlTowerList({ tenantId, schoolId: schoolId.toString() });
        const list = response.data;
        const total = response.total;
        const subjectStats = list.find(s => s.subjectId.toString() === (subject._id as any).toString());

        if (subjectStats && subjectStats.vectorChunks === 5 && total === 1) {
            console.log(`✅ SUCCESS: Correctly aggregated 5 chunks and found total 1 for ${subjectStats.subjectName}`);
        } else {
            console.error("❌ FAILURE: Aggregation or pagination incorrect.", { subjectStats, total });
            process.exit(1);
        }

        // 4. Test Toggle
        console.log("\n3. Testing toggleSubjectAi...");
        await toggleSubjectAi({
            tenantId,
            schoolId: schoolId.toString(),
            subjectId: (subject._id as any).toString(),
            isActive: true,
            enabledClasses: [new Types.ObjectId().toString()]
        });

        const updatedResponse = await getControlTowerList({ tenantId, schoolId: schoolId.toString() });
        const updatedList = updatedResponse.data;
        const activeSubject = updatedList.find(s => s.subjectId.toString() === (subject._id as any).toString());

        if (activeSubject && activeSubject.aiStatus === "Active") {
            console.log("✅ SUCCESS: AI Status toggled to Active.");
        } else {
            console.error("❌ FAILURE: AI Status not updated.");
            process.exit(1);
        }

        console.log("\n--- Verification Complete ---");

    } catch (error: any) {
        console.error("❌ Unexpected Error:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyControlTower();
