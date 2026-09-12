import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { registerSchema, loginSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema, sendVerificationCodeSchema } from "../interfaces/auth.interface.js";

const authService = new AuthService();

export class AuthController {
  async sendVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = sendVerificationCodeSchema.parse(req.body);
      const result = await authService.sendVerificationCode(data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.getMe(userId);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = updateProfileSchema.parse(req.body);
      const updatedUser = await authService.updateProfile(userId, data);
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.status(200).json({ message: "Logout realizado com sucesso" });
  }
}
