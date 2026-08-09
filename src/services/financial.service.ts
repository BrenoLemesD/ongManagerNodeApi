import { prisma } from "../config/prisma.js";
import { CreateFinancialInput, UpdateFinancialInput, ListFinancialQuery, SummaryFinancialQuery } from "../interfaces/financial.interface.js";
import { AppError } from "../middlewares/error.middleware.js";

export class FinancialService {
  private async getMembership(userId: string, ongId: string) {
    const membership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId,
          ongId,
        },
      },
    });

    if (!membership) {
      throw new AppError("Acesso negado. Você não pertence a esta ONG.", 403);
    }

    return membership;
  }

  async createTransaction(userId: string, ongId: string, data: CreateFinancialInput) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin" && membership.role !== "finance_manager") {
      throw new AppError("Apenas administradores ou gestores financeiros podem criar lançamentos.", 403);
    }

    const transaction = await prisma.financial.create({
      data: {
        ongId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        category: data.category,
        date: new Date(data.date),
        status: data.status,
        notes: data.notes,
        createdById: membership.id,
      },
      include: {
        createdBy: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return transaction;
  }

  async listTransactions(userId: string, ongId: string, query: ListFinancialQuery) {
    await this.getMembership(userId, ongId);

    const where: any = { ongId };

    if (query.type) {
      where.type = query.type;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const [total, data] = await Promise.all([
      prisma.financial.count({ where }),
      prisma.financial.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: {
          [query.orderBy || "date"]: query.orderDir || "desc",
        },
        include: {
          createdBy: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        skip: query.skip,
        take: query.take,
      },
    };
  }

  async getSummary(userId: string, ongId: string, query: SummaryFinancialQuery) {
    await this.getMembership(userId, ongId);

    const where: any = { ongId };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const transactions = await prisma.financial.findMany({
      where,
      select: {
        type: true,
        amount: true,
        status: true,
      },
    });

    let totalReceitas = 0;
    let receitaCount = 0;
    let totalDespesas = 0;
    let despesaCount = 0;

    for (const t of transactions) {
      const val = Number(t.amount);
      if (t.type === "receita") {
        totalReceitas += val;
        receitaCount++;
      } else if (t.type === "despesa") {
        totalDespesas += val;
        despesaCount++;
      }
    }

    const balance = totalReceitas - totalDespesas;

    return {
      totalReceitas,
      receitaCount,
      totalDespesas,
      despesaCount,
      balance,
    };
  }

  async updateTransaction(userId: string, ongId: string, id: string, data: UpdateFinancialInput) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin") {
      throw new AppError("Apenas administradores podem editar lançamentos financeiros.", 403);
    }

    const existing = await prisma.financial.findFirst({
      where: { id, ongId },
    });

    if (!existing) {
      throw new AppError("Lançamento financeiro não encontrado.", 404);
    }

    const updated = await prisma.financial.update({
      where: { id },
      data: {
        type: data.type !== undefined ? data.type : existing.type,
        amount: data.amount !== undefined ? data.amount : existing.amount,
        description: data.description !== undefined ? data.description : existing.description,
        category: data.category !== undefined ? data.category : existing.category,
        date: data.date !== undefined ? new Date(data.date) : existing.date,
        status: data.status !== undefined ? data.status : existing.status,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
      include: {
        createdBy: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return updated;
  }

  async deleteTransaction(userId: string, ongId: string, id: string) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin") {
      throw new AppError("Apenas administradores podem excluir lançamentos financeiros.", 403);
    }

    const existing = await prisma.financial.findFirst({
      where: { id, ongId },
    });

    if (!existing) {
      throw new AppError("Lançamento financeiro não encontrado.", 404);
    }

    await prisma.financial.delete({
      where: { id },
    });

    return { message: "Lançamento excluído com sucesso" };
  }
}
