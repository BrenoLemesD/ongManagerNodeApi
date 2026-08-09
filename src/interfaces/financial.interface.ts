import { z } from "zod";

export const createFinancialSchema = z.object({
  type: z.enum(["receita", "despesa"]),
  amount: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  status: z.enum(["pendente", "confirmado"]).default("confirmado"),
  notes: z.string().optional(),
});

export const updateFinancialSchema = z.object({
  type: z.enum(["receita", "despesa"]).optional(),
  amount: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(["pendente", "confirmado"]).optional(),
  notes: z.string().optional(),
});

export const listFinancialQuerySchema = z.object({
  skip: z.string().optional().transform((val) => (val ? Number(val) : 0)),
  take: z.string().optional().transform((val) => (val ? Number(val) : 10)),
  type: z.enum(["receita", "despesa"]).optional(),
  category: z.string().optional(),
  status: z.enum(["pendente", "confirmado"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  orderBy: z.enum(["date", "amount", "createdAt"]).optional().default("date"),
  orderDir: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const summaryFinancialQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateFinancialInput = z.infer<typeof createFinancialSchema>;
export type UpdateFinancialInput = z.infer<typeof updateFinancialSchema>;
export type ListFinancialQuery = z.infer<typeof listFinancialQuerySchema>;
export type SummaryFinancialQuery = z.infer<typeof summaryFinancialQuerySchema>;
