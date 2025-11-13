import cors , { CorsOptions } from "cors";
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
  superAdminRoutes,
  appConfigRoutes,
  academicYearRoutes,
} = AppRoutes;

const app = express();
app.set('trust proxy', 1);
//rate limiter
app.use(limiter);

const allowedOrigins: string[] = [
  "https://anyway-rackety-marylee.ngrok-free.dev",
  "https://www.skoolelite.com",
  "http://skoolelite.com",
  "https://skoolelite.com:3000",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://192.168.29.22",
];


// Middleware
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    try {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("CORS blocked:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    } catch (err) {
      console.error("CORS error:", err);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(helmet());
app.use(cookieParser());

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
// Slow down brute force (only for auth routes is good :))
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
});

//APP ROUTES
const routes: { path: string; router: Router; middlewares?: any[] }[] = [
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
routes?.forEach(({ path, router, middlewares }) => {
  if (middlewares) {
    app.use(path, ...middlewares, router);
  } else {
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

export default app;
