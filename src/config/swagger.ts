import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ONGManager API Documentation",
      version: "1.0.0",
      description: "Documentação da API REST do sistema ONGManager construída em Node.js, Express, TypeScript, Prisma e Zod.",
      contact: {
        name: "ONGManager Team",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de Desenvolvimento Local",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "Cookie JWT HttpOnly gerado no login",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        cookieAuth: [],
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
