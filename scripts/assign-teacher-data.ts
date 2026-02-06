import mongoose from "mongoose";
import { ClassModel } from "../src/modules/academics/models/class.model";
import { SectionModel } from "../src/modules/academics/models/section.model";
import { SubjectModel } from "../src/modules/academics/models/subject.model";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || "mongodb://localhost:27017/gymapi";

const teacherId = "697f6978ab12de6fb3ddbbbd";
const tenantId = "03254a3f-8c89-4a32-ae74-75e68f8062f1";
const schoolId = "68a92f1ca69d89189e2f6df6";

async function assignData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Find some classes for this school
        const classes = await ClassModel.find({ tenantId, schoolId }).limit(2);
        if (classes.length === 0) {
            console.log("No classes found for this school/tenant. Please create them first.");
            return;
        }

        // Assign teacher as Class Teacher for the first class
        classes[0].classTeacher = new mongoose.Types.ObjectId(teacherId) as any;
        await classes[0].save();
        console.log(`Assigned teacher as Class Teacher for class: ${classes[0].name}`);

        // 2. Find some sections
        const sections = await SectionModel.find({ tenantId, schoolId }).limit(2);
        if (sections.length === 0) {
            console.log("No sections found for this school/tenant.");
            return;
        }

        // Assign teacher as Homeroom Teacher for the first section
        sections[0].homeroomTeacherId = new mongoose.Types.ObjectId(teacherId) as any;

        // 3. Find some subjects
        const subjects = await SubjectModel.find({ tenantId, schoolId }).limit(2);
        if (subjects.length > 0) {
            // Assign teacher to subjects in the sections
            sections[0].subjects = [{
                subjectId: subjects[0]._id as any,
                teacherId: new mongoose.Types.ObjectId(teacherId) as any
            }];

            if (sections.length > 1) {
                sections[1].subjects = [{
                    subjectId: (subjects[1] || subjects[0])._id as any,
                    teacherId: new mongoose.Types.ObjectId(teacherId) as any
                }];
            }
        }

        await sections[0].save();
        console.log(`Assigned teacher as Homeroom Teacher and Subject Teacher for section: ${sections[0].sectionName}`);

        if (sections.length > 1) {
            await sections[1].save();
            console.log(`Assigned teacher as Subject Teacher for section: ${sections[1].sectionName}`);
        }

        console.log("\nAssignment complete. You can now test the API.");

    } catch (error) {
        console.error("Assignment failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

assignData();
