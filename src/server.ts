import app from "./app.js";
import { env } from "./config/env.js";

const PORT = Number(env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 ONGManager Express API rodando na porta ${PORT}`);
  console.log(`📚 Documentação Swagger disponível em: http://localhost:${PORT}/api-docs`);
  console.log(`==================================================`);
});
