"use strict";
// docs/swagger.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HulkGains Auth & Attendance API',
            version: '1.0.0',
            description: 'API for authentication and gym attendance tracking',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Attendance: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '64fc3b8b8af92b001ea9a3b2' },
                        userId: { type: 'string', example: '64fc3a8f8af92b001ea9a333' },
                        checkInTime: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-08-05T08:30:00Z',
                        },
                        date: {
                            type: 'string',
                            format: 'date',
                            example: '2025-08-05',
                        },
                        status: {
                            type: 'string',
                            enum: ['present', 'absent'],
                            example: 'present',
                        },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./routes/*.ts'],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
