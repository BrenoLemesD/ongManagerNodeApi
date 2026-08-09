import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join(", ") || "Dados inválidos";
    res.status(400).json({ message, details: err.errors });
    return;
  }

  console.error("[SERVER_ERROR]", err);
  res.status(500).json({ message: "Erro interno do servidor" });
}
