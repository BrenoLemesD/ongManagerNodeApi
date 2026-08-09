import rateLimit from "express-rate-limit";

// Rate Limiter Global: Máximo de 100 requisições a cada 15 minutos por IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Muitas requisições originadas deste IP. Por favor, tente novamente em 15 minutos.",
  },
});

// Rate Limiter Estrito para Autenticação (Login / Forgot Password): Máximo de 10 tentativas por 15 minutos por IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Muitas tentativas de autenticação ou recuperação de senha. Por favor, tente novamente mais tarde.",
  },
});
