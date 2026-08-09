import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  priority: z.enum(["baixa", "media", "alta", "urgente"]).default("media"),
  deadline: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
  status: z.enum(["a_fazer", "em_andamento", "aguardando_aprovacao", "concluido"]).optional(),
  deadline: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["a_fazer", "em_andamento", "aguardando_aprovacao", "concluido"]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
