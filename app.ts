import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swager';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API running successfully 🚀',
    docs: '/api-docs',
  });
});

export default app;
