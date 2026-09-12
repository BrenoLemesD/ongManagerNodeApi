import { z } from "zod";

export const sendVerificationCodeSchema = z.object({
  email: z.string().email("E-mail inválido"),
  ongName: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  ongName: z.string().optional(),
  ongCnpj: z.string().optional(),
  code: z.string().length(6, "O código de verificação deve ter 6 dígitos"),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").optional(),
  email: z.string().email("E-mail inválido").optional(),
  phone: z.string().optional().nullable(),
  oldPassword: z.string().optional(),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres").optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token de recuperação é obrigatório"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SendVerificationCodeInput = z.infer<typeof sendVerificationCodeSchema>;

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}
