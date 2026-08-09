import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import routes from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { swaggerSpec } from "./config/swagger.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (ex: mobile, curl, Postman) ou qualquer origem local
      if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Documentação Swagger em /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use(routes);

// Middleware global de tratamento de erros
app.use(errorMiddleware);

export default app;
