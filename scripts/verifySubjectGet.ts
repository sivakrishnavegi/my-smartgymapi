
import { Request, Response } from "express";
import { SubjectModel } from "../models/subject.model";

// Minimal Jest Shim for standalone execution without test runner
const jest = {
    fn: () => {
        const mock: any = (...args: any[]) => {
            mock.mock.calls.push(args);
            return mock.returnValue !== undefined ? mock.returnValue : undefined;
        };
        mock.mock = { calls: [] };
        // Chainable methods
        mock.mockReturnThis = () => { mock.returnValue = mock; return mock; };
        mock.mockResolvedValue = (val: any) => { mock.returnValue = Promise.resolve(val); return mock; };
        mock.mockReturnValue = (val: any) => { mock.returnValue = val; return mock; };
        // Lean specific shim - manually attaching it instead of calling jest.fn() recursively
        mock.lean = () => Promise.resolve([]);
        return mock;
    }
};

// Monkey patch SubjectModel for the test execution
// We need to match the chain: SubjectModel.find(...).lean()
const mockLean = jest.fn().mockResolvedValue([{ name: "Mock Subject" }]);
const mockFind = jest.fn();
mockFind.mockReturnValue({ lean: mockLean }); // find() returns object with lean()

(SubjectModel as any).find = mockFind;


import { getSubjects } from "../controllers/subjectController";

async function verifySubjectGet() {
    console.log('--- Verifying Subject GET Query Handling (Unit Test) ---');

    const basicMockRes = () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    // Test Case 1: Flat Params (Legacy/Standard)
    console.log('\nTest 1: Flat Query Params');
    const reqFlat = {
        query: {
            tenantId: "tid1",
            schoolId: "sid1",
            classId: "cid1",
            sectionId: "sec1"
        }
    } as unknown as Request;
    const resFlat = basicMockRes();

    try {
        await getSubjects(reqFlat, resFlat as Response);
        if (resFlat.status.mock.calls.length > 0 && resFlat.status.mock.calls[0][0] === 200) {
            console.log('✅ PASS: Flat params handled correctly.');
        } else {
            console.log('❌ FAIL: Flat params returned unexpected status.');
            console.log('Calls:', resFlat.status.mock.calls);
        }
    } catch (e) {
        console.error('Error in Test 1:', e);
    }

    // Test Case 2: Nested Params (Frontend Behavior)
    console.log('\nTest 2: Nested Query Params (params[key])');
    const reqNested = {
        query: {
            params: {
                tenantId: "tid1",
                schoolId: "sid1",
                classId: "cid1",
                sectionId: "sec1"
            }
        }
    } as unknown as Request;
    const resNested = basicMockRes();

    try {
        await getSubjects(reqNested, resNested as Response);
        if (resNested.status.mock.calls.length > 0 && resNested.status.mock.calls[0][0] === 200) {
            console.log('✅ PASS: Nested params handled correctly.');
        } else {
            console.log('❌ FAIL: Nested params returned unexpected status.');
            console.log('Calls:', resNested.status.mock.calls);
            if (resNested.json.mock.calls.length > 0) {
                console.log('Response:', resNested.json.mock.calls[0][0]);
            }
        }
    } catch (e) {
        console.error('Error in Test 2:', e);
    }
}

verifySubjectGet();
