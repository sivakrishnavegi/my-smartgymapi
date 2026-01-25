import cors, { CorsOptions } from "cors";
import express, { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swager";

import AppRoutes from "./routes";

import cookieParser from "cookie-parser";
import slowDown from "express-slow-down";
import helmet from "helmet";
import { limiter } from "./utils/rateLimter";

const {
  attendanceRoutes,
  userRoutes,
  authRoutes,
  schoolRoutes,
  tenantRoutes,
  googleAuthRoutes,
  googleMeetRoutes,
  rolesRoutes,
  eventRoutes,
  classesRoutes,
  sectionRoutes,
  subjectRoutes,
  superAdminRoutes,
  appConfigRoutes,
  academicYearRoutes,
  manageStaffRoutes,
  socketRoutes,
  teacherRoutes,
  libraryRoutes,
  aiTeacherRoutes,
  studentRoutes,
} = AppRoutes;

const allowedOrigins: string[] = [
  "https://anyway-rackety-marylee.ngrok-free.dev",
  "https://www.skoolelite.com",
  "https://skoolelite.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

const app = express();
app.set("trust proxy", 1);

import { requestLogger } from "./middlewares/requestLogger";

// ---------------------------------------------
// RATE LIMITER FIRST
// ---------------------------------------------
app.use(limiter);
app.use(requestLogger);

// ---------------------------------------------
// HELMET (MUST COME BEFORE CORS)
// ---------------------------------------------
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    frameguard: false,
  })
);

// ---------------------------------------------
// CORS — MUST BE AFTER HELMET
// ---------------------------------------------
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
app.use(cors(corsOptions));

// ---------------------------------------------
// BODY PARSERS
// ---------------------------------------------
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ---------------------------------------------
// COOKIE PARSER
// ---------------------------------------------
app.use(cookieParser());

// ---------------------------------------------
// API DOCS
// ---------------------------------------------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------------------------------------------
// SLOW DOWN FOR AUTH ROUTES
// ---------------------------------------------
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
});

// ---------------------------------------------
// REGISTER APP ROUTES
// ---------------------------------------------
const routes: { path: string; router: Router; middlewares?: any[] }[] = [
  { path: "/api/auth", router: authRoutes, middlewares: [speedLimiter] },
  { path: "/api/attendance", router: attendanceRoutes },
  { path: "/api/tenants", router: tenantRoutes },
  { path: "/api/schools", router: schoolRoutes },
  { path: "/api/roles", router: rolesRoutes },
  { path: "/api/classes", router: classesRoutes },
  { path: "/api/sections", router: sectionRoutes },
  { path: "/api/subjects", router: subjectRoutes },
  { path: "/api/users", router: userRoutes },
  { path: "/api/events", router: eventRoutes },
  { path: "/api/google", router: googleAuthRoutes },
  { path: "/api/googleMeet", router: googleMeetRoutes },
  { path: "/api/superadmin", router: superAdminRoutes },
  { path: "/api/admin", router: manageStaffRoutes },
  { path: "/api/app-config", router: appConfigRoutes },
  { path: "/api/academic-years", router: academicYearRoutes },
  { path: "/api/socket", router: socketRoutes },
  { path: "/api/teachers", router: teacherRoutes },
  { path: "/api/library", router: libraryRoutes },
  { path: "/api/ai-teacher", router: aiTeacherRoutes },
  { path: "/api/students", router: studentRoutes },
];

routes.forEach(({ path, router, middlewares }) => {
  if (middlewares) {
    app.use(path, ...middlewares, router);
  } else {
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

export default app;
