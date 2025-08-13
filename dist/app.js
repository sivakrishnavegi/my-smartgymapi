"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swager_1 = __importDefault(require("./docs/swager"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3001', 'http://192.168.29.22'], // frontend URL
    credentials: true
}));
app.use(express_1.default.json());
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swager_1.default));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/attendance', attendanceRoutes_1.default);
// Health check
app.get('/', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'API running successfully 🚀',
        docs: '/api-docs',
    });
});
exports.default = app;
