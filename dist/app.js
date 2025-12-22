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
const { attendanceRoutes, userRoutes, authRoutes, schoolRoutes, tenantRoutes, googleAuthRoutes, googleMeetRoutes, rolesRoutes, eventRoutes, classesRoutes, sectionRoutes, superAdminRoutes, appConfigRoutes, academicYearRoutes, manageStaffRoutes, socketRoutes, } = routes_1.default;
const allowedOrigins = [
    "https://anyway-rackety-marylee.ngrok-free.dev",
    "https://www.skoolelite.com",
    "https://skoolelite.com",
    "http://localhost:3000",
    "http://localhost:3001",
];
const app = (0, express_1.default)();
app.set("trust proxy", 1);
// ---------------------------------------------
// RATE LIMITER FIRST
// ---------------------------------------------
app.use(rateLimter_1.limiter);
// ---------------------------------------------
// HELMET (MUST COME BEFORE CORS)
// ---------------------------------------------
app.use((0, helmet_1.default)({
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    frameguard: false,
}));
// ---------------------------------------------
// CORS — MUST BE AFTER HELMET
// ---------------------------------------------
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn("Not allowed by CORS:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
    ],
    exposedHeaders: ["set-cookie"],
};
app.use((0, cors_1.default)(corsOptions));
// ---------------------------------------------
// BODY PARSERS
// ---------------------------------------------
app.use(express_1.default.json({ limit: "10kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10kb" }));
// ---------------------------------------------
// COOKIE PARSER
// ---------------------------------------------
app.use((0, cookie_parser_1.default)());
// ---------------------------------------------
// API DOCS
// ---------------------------------------------
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swager_1.default));
// ---------------------------------------------
// SLOW DOWN FOR AUTH ROUTES
// ---------------------------------------------
const speedLimiter = (0, express_slow_down_1.default)({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500,
});
// ---------------------------------------------
// REGISTER APP ROUTES
// ---------------------------------------------
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
    { path: "/api/admin", router: manageStaffRoutes },
    { path: "/api/app-config", router: appConfigRoutes },
    { path: "/api/academic-years", router: academicYearRoutes },
    { path: "/api/socket", router: socketRoutes },
];
routes.forEach(({ path, router, middlewares }) => {
    if (middlewares) {
        app.use(path, ...middlewares, router);
    }
    else {
        app.use(path, router);
    }
});
// ---------------------------------------------
// HEALTH CHECK
// ---------------------------------------------
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API running successfully",
        docs: "/api-docs",
    });
});
exports.default = app;
