import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { RegisterInput, LoginInput, AuthResponse } from "../interfaces/auth.interface.js";
import { AppError } from "../middlewares/error.middleware.js";

export class AuthService {
  async register(data: RegisterInput): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("E-mail já está em uso", 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    if (data.ongName && data.ongName.trim() !== "") {
      const ong = await prisma.ong.create({
        data: {
          name: data.ongName,
          description: `ONG criada por ${user.name}`,
        },
      });

      await prisma.userOng.create({
        data: {
          userId: user.id,
          ongId: ong.id,
          role: "admin",
        },
      });
    }

    const options: SignOptions = { expiresIn: "7d" };
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      options
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError("Credenciais inválidas", 401);
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new AppError("Credenciais inválidas", 401);
    }

    const options: SignOptions = { expiresIn: "7d" };
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      options
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    return user;
  }
}
