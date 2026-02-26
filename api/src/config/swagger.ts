import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SplitUp API",
      version: "1.0.0",
      description:
        "API para gerenciamento de despesas compartilhadas entre grupos",
      contact: {
        name: "SplitUp Team",
        email: "support@splitup.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Servidor de desenvolvimento",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            image: { type: "string", nullable: true },
            emailVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Group: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            category: {
              type: "string",
              enum: [
                "viagem",
                "festa",
                "casal",
                "imovel",
                "churrasco",
                "outros",
              ],
            },
            image: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Expense: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            description: { type: "string" },
            amount: { type: "number", format: "double" },
            category: { type: "string", nullable: true },
            groupId: { type: "string", format: "uuid" },
            paidById: { type: "string", format: "uuid" },
            date: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            amount: { type: "number", format: "double" },
            fromId: { type: "string", format: "uuid" },
            toId: { type: "string", format: "uuid" },
            expenseId: { type: "string", format: "uuid", nullable: true },
            date: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Autenticação e gerenciamento de usuários" },
      { name: "Groups", description: "Gerenciamento de grupos" },
      { name: "Expenses", description: "Gerenciamento de despesas" },
      { name: "Payments", description: "Gerenciamento de pagamentos" },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/index.ts", "./src/docs/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
