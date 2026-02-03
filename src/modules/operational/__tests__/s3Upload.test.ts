import { uploadFile } from "../../../../controllers/s3Controller"; // Path from src/modules/operational/__tests__
import { AwsService } from "../../../../services/awsService";
import Media from "../models/media.schema";

// Mock dependencies
const mockQuery: any = {
    exec: jest.fn().mockResolvedValue(null),
    then: jest.fn(function (this: any, resolve: any) {
        return Promise.resolve(this.exec()).then(resolve);
    }),
};

// Mock Media Model
jest.mock("../models/media.schema", () => {
    const mockModel: any = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "media1" }),
        _id: "media1"
    }));
    return {
        __esModule: true,
        default: mockModel,
    };
});

jest.mock("../../../../services/awsService");
jest.mock("../../../../utils/errorLogger");
jest.mock("../../../../models/errorLog.schema", () => ({ ErrorLog: {} }));

describe("S3 Upload Controller", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            headers: {
                "x-tenant-id": "test-tenant",
                "x-school-id": "test-school"
            },
            body: {
                purpose: "logo"
            },
            file: {
                originalname: "test.png",
                mimetype: "image/png",
                size: 1024,
                buffer: Buffer.from("test-content")
            },
            user: { id: "user-123" }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    it("should upload file successfully", async () => {
        (AwsService.uploadBuffer as jest.Mock).mockResolvedValue({});
        (AwsService.getDownloadUrl as jest.Mock).mockResolvedValue("https://s3.url/key");

        // Mock fallback user lookup
        (req as any).apiKeyEntry = { issuedBy: "api-user-123" };

        await uploadFile(req, res);

        expect(AwsService.uploadBuffer).toHaveBeenCalledWith(expect.objectContaining({
            key: expect.stringContaining("tenants/test-tenant/schools/test-school/logo/"),
            contentType: "image/png"
        }));

        expect(Media).toHaveBeenCalledWith(expect.objectContaining({
            fileName: expect.stringMatching(/\.png$/),
            originalName: "test.png",
            tenantId: "test-tenant",
            schoolId: "test-school",
            uploadedBy: "user-123" // From req.user
        }));

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                url: "https://s3.url/key"
            })
        }));
    });

    it("should use apiKeyEntry.issuedBy if req.user is missing", async () => {
        req.user = undefined;
        req.apiKeyEntry = { issuedBy: "api-key-user" };

        (AwsService.uploadBuffer as jest.Mock).mockResolvedValue({});

        await uploadFile(req, res);

        expect(Media).toHaveBeenCalledWith(expect.objectContaining({
            uploadedBy: "api-key-user"
        }));
    });

    it("should use system fallback if no user info provided", async () => {
        req.user = undefined;
        req.apiKeyEntry = undefined;
        req.tenant = { apiKeys: [] };

        (AwsService.uploadBuffer as jest.Mock).mockResolvedValue({});

        await uploadFile(req, res);

        expect(Media).toHaveBeenCalledWith(expect.objectContaining({
            uploadedBy: "68abcba375247cc266808bcc" // Hardcoded fallback
        }));
    });

    it("should return 400 if no file is uploaded", async () => {
        req.file = undefined;

        await uploadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "No file uploaded"
        }));
    });

    it("should return 400 if headers are missing", async () => {
        req.headers = {};

        await uploadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining("headers are required")
        }));
    });

    it("should handle S3 upload errors", async () => {
        const error = new Error("S3 Error");
        (AwsService.uploadBuffer as jest.Mock).mockRejectedValue(error);

        await uploadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
