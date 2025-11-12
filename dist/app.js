"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swager_1 = __importDefault(require("./docs/swager"));
const routes_1 = __importDefault(require("./routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimter_1 = require("./utils/rateLimter");
const { attendanceRoutes, userRoutes, authRoutes, schoolRoutes, tenantRoutes, googleAuthRoutes, googleMeetRoutes, rolesRoutes, eventRoutes, classesRoutes, sectionRoutes, superAdminRoutes, appConfigRoutes, academicYearRoutes } = routes_1.default;
const app = (0, express_1.default)();
//rate limiter
app.use(rateLimter_1.limiter);
const allowedOrigins = [
    "https://www.skoolelite.com/",
    "http://skoolelite.com/",
    "https://skoolelite.com:3000",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://192.168.29.22",
];
app.use(express_1.default.json({ limit: "10kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10kb" }));
app.use((0, helmet_1.default)());
app.use((0, cookie_parser_1.default)());
// Middleware
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
// API Documentation
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swager_1.default));
// Routes
// Slow down brute force (only for auth routes is good :))
const speedLimiter = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500,
});
//APP ROUTES
const routes = [
    { path: "/api/auth", router: authRoutes, middlewares: [speedLimiter] },
    { path: "/api/attendance", router: attendanceRoutes },
    { path: "/api/tenants", router: tenantRoutes },
    { path: "/api/schools", router: schoolRoutes },
    { path: "/api/roles", router: rolesRoutes },
    { path: "/api/classes", router: classesRoutes },
    { path: "/api/sections", router: sectionRoutes },
    { path: "/api/users", router: userRoutes },
    { path: "/api/events", router: eventRoutes },
    { path: "/api/google", router: googleAuthRoutes },
    { path: "/api/googleMeet", router: googleMeetRoutes },
    { path: "/api/superadmin", router: superAdminRoutes },
    { path: "/api/app-config", router: appConfigRoutes },
    { path: "/api/academic-years", router: academicYearRoutes },
];
// Register routes dynamically
routes === null || routes === void 0 ? void 0 : routes.forEach(({ path, router, middlewares }) => {
    if (middlewares) {
        app.use(path, ...middlewares, router);
    }
    else {
        app.use(path, router);
    }
});
// Health check
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API running successfully",
        docs: "/api-docs",
    });
});
exports.default = app;
