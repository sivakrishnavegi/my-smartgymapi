import mongoose from "mongoose";
import { Student } from "../src/modules/academics/models/student.schema";
import { ClassModel } from "../src/modules/academics/models/class.model";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_SECRET_URI || process.env.MONGODB_URI;

const tenantId = "03254a3f-8c89-4a32-ae74-75e68f8062f1";
const schoolId = "68a92f1ca69d89189e2f6df6";
const classId = "69622b51e2c53f91048628a1";

const FIRST_NAMES = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Vivaan", "Krishna", "Ishaan", "Shaurya", "Ananya", "Diya", "Saanvi", "Aadhya", "Pari", "Siya", "Riya", "Myra", "Anvi", "Prisha"];
const LAST_NAMES = ["Sharma", "Verma", "Gupta", "Malhotra", "Bhatia", "Mehta", "Joshi", "Patel", "Reddy", "Nair", "Kumar", "Singh", "Yadav", "Das", "Chopra"];
const RELATIONS = ["Father", "Mother", "Guardian"];

function getRandomItem(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateStudents() {
    if (!MONGO_URI) {
        console.error("MONGODB_SECRET_URI is not defined");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Get Class to find a valid Section
        const classObj = await ClassModel.findById(classId);
        if (!classObj) {
            console.error(`Class with ID ${classId} not found.`);
            return;
        }

        if (!classObj.sections || classObj.sections.length === 0) {
            console.error(`Class ${classObj.name} (Code: ${classObj.code}) has no sections assigned. Please create a section first.`);
            // Fallback: If no sections in class, we can't create students strictly compliant with schema needing sectionId
            // But check if we can query SectionModel directly? The user gave classId. 
            // Usually Class -> Sections.
            return;
        }

        // Distribute students across available sections
        const sectionIds = classObj.sections;
        console.log(`Found ${sectionIds.length} sections in class ${classObj.name}`);

        const studentsToCreate = [];

        for (let i = 0; i < 50; i++) { // Generating 50 students as requested
            const sectionId = sectionIds[i % sectionIds.length];
            const firstName = getRandomItem(FIRST_NAMES);
            const lastName = getRandomItem(LAST_NAMES);

            studentsToCreate.push({
                tenantId,
                schoolId,
                classId,
                sectionId,
                admissionNo: `ADM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                rollNo: `${100 + i}`,
                firstName,
                lastName,
                dob: getRandomDate(new Date(2010, 0, 1), new Date(2015, 0, 1)),
                gender: Math.random() > 0.5 ? "Male" : "Female",
                admissionDate: new Date(),
                status: "Active",
                contact: {
                    phone: "9876543210",
                    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                    address: {
                        line1: "123 Mock Street",
                        city: "Mock City",
                        state: "State",
                        country: "India"
                    }
                },
                guardians: [
                    {
                        name: `Mr. ${lastName}`,
                        relation: getRandomItem(RELATIONS),
                        phone: "9876543210"
                    }
                ]
            });
        }

        const result = await Student.insertMany(studentsToCreate);
        console.log(`Successfully created ${result.length} mock students.`);

        console.log("Sample Created Student IDs:");
        result.slice(0, 5).forEach(s => console.log(`- ${s._id} (${s.firstName} ${s.lastName})`));

    } catch (error) {
        console.error("Error generating students:", error);
    } finally {
        await mongoose.disconnect();
    }
}

generateStudents();
