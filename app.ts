import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swager";
import attendanceRoutes from "./routes/attendanceRoutes";
import authRoutes from "./routes/authRoutes";
import classesRoutes from './routes/classRoutes';
import eventRoutes from './routes/eventRoutes';
import rolesRoutes from "./routes/roleRoutes";
import schoolRoutes from "./routes/school.routes";
import sectionRoutes from './routes/section.routes';
import tenantRoutes from "./routes/tenantRoutes";
import userRoutes from './routes/user.routes';
import googleAuthRoutes from './routes/googleAuthRoutes';
import { limiter } from "./utils/rateLimter";
import helmet from "helmet";
import slowDown from "express-slow-down";


const app = express();

//rate limiter
app.use(limiter);


const allowedOrigins = ["http://localhost:3000","http://localhost:3001", "http://192.168.29.22"];


app.use(express.json({ limit: "10kb" })); 
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(helmet());

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));


// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
// Slow down brute force (only for auth routes is good :))
const speedLimiter = slowDown({ windowMs: 15*60*1000, delayAfter: 50,  delayMs: () => 500 });
app.use("/api/auth", speedLimiter, authRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/tenants", tenantRoutes);

app.use("/api/schools", schoolRoutes);

app.use("/api/roles", rolesRoutes);

app.use("/api/classes", classesRoutes);

app.use("/api/sections", sectionRoutes);

app.use("/api/users", userRoutes);

app.use('/api/events', eventRoutes);

app.use("/api/google", googleAuthRoutes);


// Health check
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API running successfully",
    docs: "/api-docs",
  });
});

export default app;
