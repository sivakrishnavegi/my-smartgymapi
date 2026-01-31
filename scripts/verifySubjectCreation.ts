
import { createSubject } from "@academics/controllers/subjectController";
import { Request, Response } from "express";

async function verifySubjectCreation() {
    console.log('--- Verifying Subject Creation Error Handling (Unit Test) ---');

    const req = {
        body: {
            classId: '6947b4696c7ce228d16fd39f',
            name: "eng101",
            code: "ENG134",
            creditHours: 4,
            description: "eng",
            tenantId: "03254a3f-8c89-4a32-ae74-75e68f8062f1",
            schoolId: "68a92f1ca69d89189e2f6df6",
            sectionId: "default" // Invalid ID
        }
    } as unknown as Request;

    const res = {
        status: (code: number) => {
            console.log(`Response Status: ${code}`);
            return res;
        },
        json: (data: any) => {
            console.log('Response Body:', data);
            if (data.message === "Invalid classId or sectionId format") {
                console.log('✅ PASS: Correctly handled invalid sectionId with 400 Bad Request.');
            } else {
                console.log('❌ FAIL: Expected 400 with specific message, got something else.');
            }
            return res;
        }
    } as unknown as Response;

    try {
        await createSubject(req, res);
    } catch (error) {
        console.error('Unexpected error during execution:', error);
    }
}

verifySubjectCreation();
