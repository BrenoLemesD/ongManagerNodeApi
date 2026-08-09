import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./error.middleware.js";

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  let token: string | undefined = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) {
    throw new AppError("Não autorizado. Token não fornecido.", 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    throw new AppError("Sessão inválida ou expirada", 401);
  }
}
