import rateLimit from "express-rate-limit";

// Rate Limiter Global: Relaxado em desenvolvimento para testes/capturas
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: process.env.NODE_ENV === "production" ? 100 : 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Muitas requisições originadas deste IP. Por favor, tente novamente em 15 minutos.",
  },
});

// Rate Limiter Estrito para Autenticação: Relaxado em desenvolvimento
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: process.env.NODE_ENV === "production" ? 10 : 500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Muitas tentativas de autenticação ou recuperação de senha. Por favor, tente novamente mais tarde.",
  },
});
