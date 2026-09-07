import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  date: z.string().min(1, "Data e horário do evento são obrigatórios"),
  location: z.string().optional(),
  maxTickets: z.coerce.number().int().min(1, "A quantidade de ingressos deve ser de no mínimo 1"),
  hasLandingPage: z.boolean().optional().default(false),
  landingTemplate: z.enum(["modern", "warm", "minimal"]).optional().default("modern"),
  primaryColor: z.string().optional().default("#7c3aed"),
  bannerUrl: z.string().optional(),
  ctaText: z.string().optional().default("Garantir meu Ingresso"),
});

export const updateEventSchema = z.object({
  title: z.string().min(1, "Título não pode ser vazio").optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  maxTickets: z.coerce.number().int().min(1, "A quantidade de ingressos deve ser de no mínimo 1").optional(),
  status: z.enum(["ativo", "encerrado", "cancelado"]).optional(),
  hasLandingPage: z.boolean().optional(),
  landingTemplate: z.enum(["modern", "warm", "minimal"]).optional(),
  primaryColor: z.string().optional(),
  bannerUrl: z.string().optional(),
  ctaText: z.string().optional(),
});

export const registerGuestSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
});

export const updateGuestStatusSchema = z.object({
  status: z.enum(["confirmado", "presente", "cancelado"]),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type RegisterGuestInput = z.infer<typeof registerGuestSchema>;
export type UpdateGuestStatusInput = z.infer<typeof updateGuestStatusSchema>;
