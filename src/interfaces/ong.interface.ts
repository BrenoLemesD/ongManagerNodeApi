import { z } from "zod";

export const createOngSchema = z.object({
  name: z.string().min(2, "Nome da ONG deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
});

export const createVolunteerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  role: z.enum(["admin", "finance_manager", "member"]).default("member"),
});

export type CreateOngInput = z.infer<typeof createOngSchema>;
export type CreateVolunteerInput = z.infer<typeof createVolunteerSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
