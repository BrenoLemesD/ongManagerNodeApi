import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";
import { swaggerSpec } from "./config/swagger.js";

const app = express();

// Configuração de CORS com credenciais (cookies HTTP-Only)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        env.CORS_ORIGIN,
        env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
      ];
      // Permite requisições sem origin (ex: Postman, cURL) ou origens permitidas
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback para desenvolvimento
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json());

// Aplica Rate Limiting Global a todas as rotas da API
app.use(globalLimiter);

// Documentação Swagger em /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use(routes);

// Middleware global de tratamento de erros
app.use(errorMiddleware);

export default app;
