import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { sendMail, sendMailSafe } from "../config/mail.js";
import { resetPasswordEmailTemplate } from "../templates/emails/resetPassword.template.js";
import { verificationCodeEmailTemplate } from "../templates/emails/verificationCode.template.js";
import { passwordChangedEmailTemplate } from "../templates/emails/passwordChanged.template.js";
import { RegisterInput, LoginInput, UpdateProfileInput, ForgotPasswordInput, ResetPasswordInput, AuthResponse, SendVerificationCodeInput } from "../interfaces/auth.interface.js";
import { AppError } from "../middlewares/error.middleware.js";

export class AuthService {
  async sendVerificationCode(data: SendVerificationCodeInput) {
    const cleanEmail = data.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new AppError("E-mail já está em uso por outra conta", 400);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await prisma.emailVerificationCode.deleteMany({
      where: {
        email: cleanEmail,
        type: "register_ong",
      },
    });

    await prisma.emailVerificationCode.create({
      data: {
        email: cleanEmail,
        code,
        type: "register_ong",
        expiresAt,
      },
    });

    const html = verificationCodeEmailTemplate({
      code,
      ongName: data.ongName,
    });

    await sendMail({
      to: cleanEmail,
      subject: "Código de Verificação - ONGManager",
      html,
    });

    return {
      message: "Código de verificação enviado com sucesso",
      expiresInSeconds: 600,
    };
  }

  async register(data: RegisterInput): Promise<AuthResponse> {
    const cleanEmail = data.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new AppError("E-mail já está em uso", 400);
    }

    const verification = await prisma.emailVerificationCode.findFirst({
      where: {
        email: cleanEmail,
        code: data.code.trim(),
        type: "register_ong",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      throw new AppError("Código de verificação inválido", 400);
    }

    if (verification.expiresAt < new Date()) {
      throw new AppError("Código de verificação expirado. Por favor, solicite um novo código.", 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: cleanEmail,
        password: hashedPassword,
      },
    });

    if (data.ongName && data.ongName.trim() !== "") {
      const ong = await prisma.ong.create({
        data: {
          name: data.ongName,
          cnpj: data.ongCnpj || null,
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

    // Limpa os códigos de verificação após uso com sucesso
    await prisma.emailVerificationCode.deleteMany({
      where: {
        email: cleanEmail,
        type: "register_ong",
      },
    });

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
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    const updateData: { name?: string; email?: string; phone?: string | null; password?: string } = {};

    if (data.name && data.name.trim() !== "") {
      updateData.name = data.name;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new AppError("E-mail já está em uso por outro usuário", 400);
      }
      updateData.email = data.email;
    }

    if (data.newPassword) {
      if (!data.oldPassword) {
        throw new AppError("Informe a senha atual para alterar a senha", 400);
      }

      const passwordMatch = await bcrypt.compare(data.oldPassword, user.password);
      if (!passwordMatch) {
        throw new AppError("Senha atual incorreta", 400);
      }

      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    if (data.newPassword) {
      try {
        const nowFormatted = new Date().toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "short",
          timeStyle: "short",
        });
        const supportUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/forgot-password`;

        const html = passwordChangedEmailTemplate({
          userName: updatedUser.name,
          changedAt: nowFormatted,
          supportUrl,
        });

        sendMailSafe({
          to: updatedUser.email,
          subject: "[Segurança] Sua senha foi alterada no ONGManager",
          html,
        });
      } catch (err) {
        console.error("[AUTH][EMAIL] Erro ao enviar alerta de senha alterada:", err);
      }
    }

    return updatedUser;
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return { message: "Se o e-mail estiver cadastrado, um link de recuperação foi enviado." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de expiração

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const frontendUrl = env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const htmlContent = resetPasswordEmailTemplate({
      name: user.name,
      resetUrl,
    });

    await sendMail({
      to: user.email,
      subject: "Recuperação de Senha - ONGManager",
      html: htmlContent,
    });

    return { message: "Se o e-mail estiver cadastrado, um link de recuperação foi enviado." };
  }

  async resetPassword(data: ResetPasswordInput) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: data.token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new AppError("Token de recuperação inválido ou inexistente", 400);
    }

    if (new Date() > resetToken.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new AppError("Token de recuperação expirou", 400);
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return { message: "Senha redefinida com sucesso! Você já pode fazer login." };
  }
}
