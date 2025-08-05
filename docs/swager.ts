import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HulkGains Auth API',
      version: '1.0.0',
      description: 'API for user authentication and access control',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./routes/*.ts'], // Swagger will scan these files for JSDoc comments
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
