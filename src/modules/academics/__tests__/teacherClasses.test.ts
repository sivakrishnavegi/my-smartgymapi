import { getTeacherClassesAndSections } from "@academics/controllers/teacherController";
import { ClassModel } from "@academics/models/class.model";
import { SectionModel } from "@academics/models/section.model";
import mongoose from "mongoose";

// Mock dependencies
const mockQuery: any = {
    exec: jest.fn().mockResolvedValue([]),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    then: jest.fn(function (this: any, resolve: any) {
        return Promise.resolve(this.exec()).then(resolve);
    }),
};

jest.mock("mongoose", () => {
    const originalMongoose = jest.requireActual("mongoose");
    return {
        ...originalMongoose,
        Schema: class extends originalMongoose.Schema {
            constructor(definition: any, options: any) {
                super(definition, options);
            }
        },
        model: jest.fn().mockReturnValue({
            find: jest.fn(() => mockQuery),
            findOne: jest.fn(() => mockQuery),
        }),
    };
});

jest.mock("@academics/models/class.model", () => ({
    __esModule: true,
    ClassModel: {
        find: jest.fn(() => mockQuery),
    },
}));

jest.mock("@academics/models/section.model", () => ({
    __esModule: true,
    SectionModel: {
        find: jest.fn(() => ({
            lean: jest.fn().mockResolvedValue([])
        })),
    },
}));

jest.mock("@iam/models/users.schema", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock("@academics/models/TeacherProfile", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock("@academics/models/schools.schema", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock("@shared/utils/errorLogger");

describe("Teacher Classes Controller", () => {
    let req: any;
    let res: any;
    const userId = new mongoose.Types.ObjectId().toString();
    const tenantId = "t1";
    const schoolId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            params: { userId },
            query: { tenantId, schoolId }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    it("should return empty list if no classes or sections assigned", async () => {
        (SectionModel.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
        });
        (ClassModel.find as jest.Mock).mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([])
        });

        await getTeacherClassesAndSections(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: []
        }));
    });

    it("should return classes where teacher is Class Teacher", async () => {
        const classId = new mongoose.Types.ObjectId();
        const sectionId = new mongoose.Types.ObjectId();

        (SectionModel.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
        });

        (ClassModel.find as jest.Mock).mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([{
                _id: classId,
                name: "Grade 10",
                code: "G10",
                classTeacher: userId,
                sections: [{
                    _id: sectionId,
                    sectionName: "A",
                    sectionCode: "10A"
                }]
            }])
        });

        await getTeacherClassesAndSections(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0].data;
        expect(responseData).toHaveLength(1);
        expect(responseData[0].isPrimaryClassTeacher).toBe(true);
        expect(responseData[0].sections).toHaveLength(1);
    });

    it("should return sections where teacher is Homeroom Teacher", async () => {
        const classId = new mongoose.Types.ObjectId();
        const sectionId = new mongoose.Types.ObjectId();

        (SectionModel.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue([{
                _id: sectionId,
                sectionName: "B",
                homeroomTeacherId: userId
            }])
        });

        (ClassModel.find as jest.Mock).mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([{
                _id: classId,
                name: "Grade 11",
                code: "G11",
                sections: [{
                    _id: sectionId,
                    sectionName: "B",
                    sectionCode: "11B",
                    homeroomTeacherId: userId
                }]
            }])
        });

        await getTeacherClassesAndSections(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0].data;
        expect(responseData[0].sections[0].isHomeroomTeacher).toBe(true);
    });
});
