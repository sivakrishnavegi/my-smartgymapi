import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swager';
import attendanceRoutes from './routes/attendanceRoutes';
import authRoutes from './routes/authRoutes';
import schoolRoutes from './routes/school.routes';
import tenantRoutes from './routes/tenantRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3001','http://192.168.29.22'], // frontend URL
  credentials: true
}))
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/attendance', attendanceRoutes);

app.use("/api/tenants", tenantRoutes);

app.use("/api/schools", schoolRoutes);

// Health check
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API running successfully 🚀',
    docs: '/api-docs',
  });
});

export default app;
