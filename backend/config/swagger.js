const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CPF System API Documentation',
      version: '1.0.0',
      description: 'API documentation for the CPF System',
      contact: {
        name: 'API Support',
        email: 'support@cpfsystem.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
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
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: [
    './app/routes/*.js',
    './app/models/*.js',
  ],
};

module.exports = swaggerJsdoc(options);
