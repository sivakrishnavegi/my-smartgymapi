import mongoose from "mongoose";

// Mock Data
const mockTeacherId = new mongoose.Types.ObjectId();
const mockTenantId = "tenant-123";
const mockSchoolId = new mongoose.Types.ObjectId();
const mockSubjectId1 = new mongoose.Types.ObjectId();
const mockSubjectId2 = new mongoose.Types.ObjectId();

const mockSections = [
    {
        _id: new mongoose.Types.ObjectId(),
        sectionName: "A",
        sectionCode: "10A",
        homeroomTeacherId: mockTeacherId,
        subjects: [
            { subjectId: mockSubjectId1, teacherId: mockTeacherId },
            { subjectId: mockSubjectId2, teacherId: new mongoose.Types.ObjectId() } // Another teacher
        ]
    },
    {
        _id: new mongoose.Types.ObjectId(),
        sectionName: "B",
        sectionCode: "10B",
        homeroomTeacherId: new mongoose.Types.ObjectId(),
        subjects: [
            { subjectId: mockSubjectId1, teacherId: mockTeacherId }
        ]
    }
];

const mockClasses = [
    {
        _id: new mongoose.Types.ObjectId(),
        name: "Grade 10",
        code: "G10",
        classTeacher: mockTeacherId,
        sections: mockSections
    }
];

// Logic Demonstration (Isolated from Controller to show output clearly)
const demonstrateResult = () => {
    const sectionIds = mockSections.map(s => s._id.toString());
    const userIdStr = mockTeacherId.toString();

    const result = mockClasses.map(cls => {
        const assignedSections = cls.sections.filter((sec: any) =>
            sectionIds.includes(sec._id.toString()) ||
            cls.classTeacher?.toString() === userIdStr
        );

        return {
            _id: cls._id,
            name: cls.name,
            code: cls.code,
            isPrimaryClassTeacher: cls.classTeacher?.toString() === userIdStr,
            sections: assignedSections.map((sec: any) => ({
                _id: sec._id,
                sectionName: sec.sectionName,
                sectionCode: sec.sectionCode,
                isHomeroomTeacher: sec.homeroomTeacherId?.toString() === userIdStr,
                assignedSubjects: (sec.subjects || [])
                    .filter((sub: any) => sub.teacherId?.toString() === userIdStr)
                    .map((sub: any) => sub.subjectId)
            }))
        };
    });

    console.log(JSON.stringify(result, null, 2));
};

console.log("--- DEMONSTRATING API OUTPUT WITH MOCK DATA ---");
console.log(`Teacher ID: ${mockTeacherId}`);
console.log(`Tenant ID: ${mockTenantId}`);
console.log(`School ID: ${mockSchoolId}`);
console.log("\n--- RESULT ---");
demonstrateResult();
