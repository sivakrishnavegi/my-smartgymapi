import mongoose from 'mongoose';
import { ClassModel } from '../models/class.model';
import { SectionModel } from '../models/section.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gymapi';

async function verifySectionAssignment() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Cleanup previous test data
        await ClassModel.deleteMany({ name: /^TEST_CLASS_/ });
        await SectionModel.deleteMany({ sectionName: /^TEST_SECTION_/ });

        const tenantId = 'test-tenant';
        const schoolId = new mongoose.Types.ObjectId();

        // Create Test Sections
        const section1 = await SectionModel.create({
            tenantId,
            schoolId,
            sectionName: 'TEST_SECTION_1',
            createdBy: new mongoose.Types.ObjectId(),
        });

        const section2 = await SectionModel.create({
            tenantId,
            schoolId,
            sectionName: 'TEST_SECTION_2',
            createdBy: new mongoose.Types.ObjectId(),
        });

        const section3 = await SectionModel.create({
            tenantId,
            schoolId,
            sectionName: 'TEST_SECTION_3',
            createdBy: new mongoose.Types.ObjectId(),
        });

        // Create Test Classes
        const classA = await ClassModel.create({
            tenantId,
            schoolId,
            name: 'TEST_CLASS_A',
            sections: [section1._id], // Already assigned Section 1
        });

        const classB = await ClassModel.create({
            tenantId,
            schoolId,
            name: 'TEST_CLASS_B',
            sections: [],
        });

        console.log('Setup complete:');
        console.log('Class A has Section 1');
        console.log('Class B has no sections');
        console.log('Section 2 is unassigned');

        // Simulate updateSectionsByClass logic locally first to verify expectations
        // We want to assign [Section 1, Section 2] to Class B.
        // Logic should:
        // 1. Identify Section 1 is in Class A.
        // 2. Identify Section 2 is free.
        // 3. Update Class B with [Section 2].

        const s1Id = (section1 as any)._id?.toString() || (section1 as any).id;
        const s2Id = (section2 as any)._id?.toString() || (section2 as any).id;
        const s3Id = (section3 as any)._id?.toString() || (section3 as any).id;

        const sectionsToAssignToB = [s1Id, s2Id, s3Id];

        // Simulate the logic we are about to implement in the controller
        // -------------------------------------------------------------

        // Find classes that contain any of these sections, EXCLUDING the current class (Class B)
        const conflictingClasses = await ClassModel.find({
            _id: { $ne: classB._id },
            sections: { $in: sectionsToAssignToB }
        }).select('sections');

        const claimedSectionIds = new Set();
        conflictingClasses.forEach(cls => {
            if (cls.sections) {
                cls.sections.forEach(secId => {
                    if (sectionsToAssignToB.includes(secId.toString())) {
                        claimedSectionIds.add(secId.toString());
                    }
                });
            }
        });

        console.log('Claimed Section IDs found (should include Section 1):', Array.from(claimedSectionIds));

        const finalSectionsForB = sectionsToAssignToB.filter(secId => !claimedSectionIds.has(secId));

        console.log('Final sections to assign to Class B (should assume Section 1 is omitted):', finalSectionsForB);

        // -------------------------------------------------------------

        if (finalSectionsForB.includes(s1Id)) {
            console.error('FAILURE: Section 1 should have been filtered out!');
        } else if (!finalSectionsForB.includes(s2Id) || !finalSectionsForB.includes(s3Id)) {
            console.error('FAILURE: Section 2 and 3 should be included!');
        } else {
            console.log('SUCCESS: Logic correctly identified valid sections.');
        }

        // Cleanup
        await ClassModel.deleteMany({ name: /^TEST_CLASS_/ });
        await SectionModel.deleteMany({ sectionName: /^TEST_SECTION_/ });
        await mongoose.disconnect();

    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

verifySectionAssignment();
