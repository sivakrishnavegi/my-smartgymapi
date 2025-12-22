"use strict";
// docs/swagger.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "HulkGains Auth & Attendance API",
            version: "1.0.0",
            description: "API for authentication and gym attendance tracking",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                Attendance: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "64fc3b8b8af92b001ea9a3b2" },
                        userId: { type: "string", example: "64fc3a8f8af92b001ea9a333" },
                        checkInTime: {
                            type: "string",
                            format: "date-time",
                            example: "2025-08-05T08:30:00Z",
                        },
                        date: {
                            type: "string",
                            format: "date",
                            example: "2025-08-05",
                        },
                        status: {
                            type: "string",
                            enum: ["present", "absent"],
                            example: "present",
                        },
                    },
                },
                Tenant: {
                    type: "object",
                    properties: {
                        tenantId: { type: "string" },
                        name: { type: "string" },
                        domain: { type: "string" },
                        plan: { type: "string", enum: ["free", "pro", "enterprise"] },
                        subscription: {
                            type: "object",
                            properties: {
                                startDate: { type: "string", format: "date-time" },
                                endDate: { type: "string", format: "date-time" },
                                status: {
                                    type: "string",
                                    enum: ["active", "expired", "grace"],
                                },
                                maxUsers: { type: "integer" },
                                maxStudents: { type: "integer" },
                            },
                        },
                    },
                },
                Section: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "64fc4d8b8af92b001ea9a3f1" },
                        tenantId: { type: "string", example: "tenavvvnt123" },
                        schoolId: { type: "string", example: "64fc3c8f8af92b001ea9a444" },
                        sectionName: { type: "string", example: "Section A" },
                        sectionCode: { type: "string", example: "D1503" },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            example: "2025-08-05T08:30:00Z",
                        },
                    },
                    required: ["tenantId", "schoolId", "sectionName"],
                },
                // 🔹 Add User schemas here
                User: {
                    type: "object",
                    required: ["tenantId", "schoolId", "userType", "roles"],
                    properties: {
                        _id: { type: "string", format: "ObjectId" },
                        tenantId: { type: "string" },
                        schoolId: { type: "string", format: "ObjectId" },
                        userType: {
                            type: "string",
                            enum: ["admin", "teacher", "student", "librarian", "guardian"],
                        },
                        profile: { $ref: "#/components/schemas/UserProfile" },
                        account: { $ref: "#/components/schemas/UserAccount" },
                        roles: {
                            type: "array",
                            items: { type: "string", format: "ObjectId" },
                        },
                        linkedStudentIds: {
                            type: "array",
                            items: { type: "string", format: "ObjectId" },
                        },
                        employment: { $ref: "#/components/schemas/UserEmployment" },
                        enrollment: { $ref: "#/components/schemas/UserEnrollment" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                UserProfile: {
                    type: "object",
                    properties: {
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        dob: { type: "string", format: "date" },
                        gender: { type: "string" },
                        photoUrl: { type: "string", format: "uri" },
                        address: { type: "string" },
                        contact: {
                            type: "object",
                            properties: {
                                phone: { type: "string" },
                                email: { type: "string", format: "email" },
                            },
                        },
                    },
                },
                UserAccount: {
                    type: "object",
                    properties: {
                        email: { type: "string", format: "email" },
                        username: { type: "string" },
                        passwordHash: { type: "string" },
                        status: {
                            type: "string",
                            enum: ["active", "inactive", "suspended"],
                        },
                    },
                },
                UserEmployment: {
                    type: "object",
                    properties: {
                        staffId: { type: "string" },
                        deptId: { type: "string" },
                        hireDate: { type: "string", format: "date-time" },
                    },
                },
                UserEnrollment: {
                    type: "object",
                    properties: {
                        studentId: { type: "string" },
                        classId: { type: "string", format: "ObjectId" },
                        sectionId: { type: "string", format: "ObjectId" },
                        regNo: { type: "string" },
                    },
                },
                School: {
                    type: "object",
                    properties: {
                        tenantId: { type: "string", example: "tenant123" },
                        name: { type: "string", example: "ABC High School" },
                        address: { type: "string", example: "123 Street, City" },
                        contact: {
                            type: "object",
                            properties: {
                                phone: { type: "string", example: "+911234567890" },
                                email: { type: "string", example: "info@school.com" },
                            },
                        },
                        academicYears: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    yearId: { type: "string", example: "2025-2026" },
                                    start: {
                                        type: "string",
                                        format: "date",
                                        example: "2025-06-01",
                                    },
                                    end: {
                                        type: "string",
                                        format: "date",
                                        example: "2026-05-31",
                                    },
                                    status: {
                                        type: "string",
                                        enum: ["active", "archived"],
                                        example: "active",
                                    },
                                },
                            },
                        },
                        settings: { type: "object", example: { theme: "blue" } },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            example: "2025-08-16T10:00:00Z",
                        },
                    },
                },
                Event: {
                    type: "object",
                    required: ["title", "startDate", "endDate", "createdBy"],
                    properties: {
                        _id: {
                            type: "string",
                            example: "64d3f123abc4567890def123",
                        },
                        title: {
                            type: "string",
                            example: "Annual Sports Day",
                        },
                        description: {
                            type: "string",
                            example: "Sports event for all classes",
                        },
                        startDate: {
                            type: "string",
                            format: "date-time",
                            example: "2025-09-01T10:00:00Z",
                        },
                        endDate: {
                            type: "string",
                            format: "date-time",
                            example: "2025-09-01T16:00:00Z",
                        },
                        bannerUrl: {
                            type: "string",
                            example: "https://example.com/banner.jpg",
                        },
                        createdBy: {
                            type: "string",
                            example: "64d3f123abc4567890def123",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            example: "2025-08-18T12:34:56Z",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            example: "2025-08-18T12:34:56Z",
                        },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: [
        "./routes/**/*.ts", // all TS files inside routes and subfolders
        "./src/routes/**/*.ts", // if your project has src folder
        "./src/**/*.ts", // safest option
    ],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
