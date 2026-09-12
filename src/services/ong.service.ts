import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { sendMailSafe } from "../config/mail.js";
import { volunteerWelcomeEmailTemplate } from "../templates/emails/volunteerWelcome.template.js";
import { memberRoleUpdatedEmailTemplate } from "../templates/emails/memberRoleUpdated.template.js";
import { CreateOngInput, UpdateOngInput, CreateVolunteerInput, AddMemberInput, UpdateMemberRoleInput } from "../interfaces/ong.interface.js";
import { AppError } from "../middlewares/error.middleware.js";

export class OngService {
  async createOng(userId: string, data: CreateOngInput) {
    const ong = await prisma.ong.create({
      data: {
        name: data.name,
        cnpj: data.cnpj || null,
        description: data.description,
      },
    });

    await prisma.userOng.create({
      data: {
        userId,
        ongId: ong.id,
        role: "admin",
      },
    });

    return ong;
  }

  async updateOng(ongId: string, userId: string, data: UpdateOngInput) {
    const membership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId,
          ongId,
        },
      },
    });

    if (!membership || membership.role !== "admin") {
      throw new AppError("Apenas administradores podem editar os dados da ONG.", 403);
    }

    const updatedOng = await prisma.ong.update({
      where: { id: ongId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return updatedOng;
  }

  async deleteOng(ongId: string, userId: string) {
    const membership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId,
          ongId,
        },
      },
    });

    if (!membership || membership.role !== "admin") {
      throw new AppError("Apenas administradores podem excluir a ONG.", 403);
    }

    // Soft delete: marca active como false
    await prisma.ong.update({
      where: { id: ongId },
      data: { active: false },
    });

    return { message: "ONG desativada com sucesso (Soft Delete)." };
  }

  async getUserOngs(userId: string) {
    const userOngs = await prisma.userOng.findMany({
      where: {
        userId,
        active: true,
        ong: { active: true },
      },
      include: {
        ong: true,
      },
    });

    return userOngs.map((uo) => ({
      ...uo.ong,
      role: uo.role,
    }));
  }

  async getOngById(userId: string, ongId: string) {
    const membership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId,
          ongId,
        },
      },
    });

    if (!membership || !membership.active) {
      throw new AppError("Acesso negado. Você não pertence a esta ONG.", 403);
    }

    const ong = await prisma.ong.findFirst({
      where: { id: ongId, active: true },
      include: {
        members: {
          where: { active: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!ong) {
      throw new AppError("ONG não encontrada ou inativa.", 404);
    }

    return {
      ...ong,
      userRole: membership.role,
    };
  }

  async getOngMembers(userId: string, ongId: string) {
    const membership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId,
          ongId,
        },
      },
    });

    if (!membership || !membership.active) {
      throw new AppError("Acesso negado. Você não pertence a esta ONG.", 403);
    }

    const members = await prisma.userOng.findMany({
      where: { ongId, active: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return members;
  }

  async createVolunteer(userId: string, ongId: string, data: CreateVolunteerInput) {
    const adminMembership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId,
          ongId,
        },
      },
    });

    if (!adminMembership || adminMembership.role !== "admin") {
      throw new AppError("Apenas administradores podem cadastrar voluntários.", 403);
    }

    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
        },
      });
    }

    const existingMembership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId: user.id,
          ongId,
        },
      },
    });

    if (existingMembership) {
      if (!existingMembership.active) {
        const reactivated = await prisma.userOng.update({
          where: { id: existingMembership.id },
          data: { active: true, role: "member" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        return reactivated;
      }
      throw new AppError("Este usuário já é membro ativo desta ONG.", 400);
    }

    const membership = await prisma.userOng.create({
      data: {
        userId: user.id,
        ongId,
        role: "member",
        active: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    try {
      const ong = await prisma.ong.findUnique({ where: { id: ongId }, select: { name: true } });
      const loginUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/`;

      if (membership.user?.email) {
        const html = volunteerWelcomeEmailTemplate({
          userName: membership.user.name,
          ongName: ong?.name || "Sua ONG",
          userEmail: membership.user.email,
          roleTitle: "Voluntário(a)",
          loginUrl,
        });

        sendMailSafe({
          to: membership.user.email,
          subject: `[Boas-vindas] Você agora faz parte da ONG ${ong?.name || "ONGManager"}`,
          html,
        });
      }
    } catch (err) {
      console.error("[VOLUNTEER][EMAIL] Erro ao enviar e-mail de boas-vindas:", err);
    }

    return membership;
  }

  async addMember(adminUserId: string, ongId: string, data: AddMemberInput) {
    const adminMembership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId: adminUserId,
          ongId,
        },
      },
    });

    if (!adminMembership || adminMembership.role !== "admin" || !adminMembership.active) {
      throw new AppError("Apenas administradores podem adicionar membros.", 403);
    }

    const membership = await prisma.userOng.create({
      data: {
        userId: data.userId,
        ongId,
        role: data.role,
        active: true,
      },
    });

    return membership;
  }

  async updateMemberRole(adminUserId: string, ongId: string, memberId: string, newRole: "admin" | "finance_manager" | "member") {
    const adminMembership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId: adminUserId,
          ongId,
        },
      },
    });

    if (!adminMembership || adminMembership.role !== "admin" || !adminMembership.active) {
      throw new AppError("Apenas administradores podem alterar funções de membros.", 403);
    }

    const targetMember = await prisma.userOng.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.ongId !== ongId || !targetMember.active) {
      throw new AppError("Membro ativo não encontrado nesta ONG.", 404);
    }

    // Se estiver rebaixando um admin, verificar se há pelo menos 1 outro admin ativo
    if (targetMember.role === "admin" && newRole !== "admin") {
      const adminCount = await prisma.userOng.count({
        where: { ongId, role: "admin", active: true },
      });

      if (adminCount <= 1) {
        throw new AppError("Não é possível alterar a função do único administrador ativo da ONG.", 400);
      }
    }

    const updated = await prisma.userOng.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    try {
      const ong = await prisma.ong.findUnique({ where: { id: ongId }, select: { name: true } });
      const dashboardUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/dashboard`;

      const roleLabels: Record<string, string> = {
        admin: "Administrador(a)",
        finance_manager: "Gestor(a) Financeiro",
        member: "Voluntário(a) / Membro",
      };

      if (updated.user?.email) {
        const html = memberRoleUpdatedEmailTemplate({
          userName: updated.user.name,
          ongName: ong?.name || "Sua ONG",
          newRoleLabel: roleLabels[newRole] || newRole,
          dashboardUrl,
        });

        sendMailSafe({
          to: updated.user.email,
          subject: `[Atualização de Cargo] Seu cargo na ONG ${ong?.name || "ONGManager"} foi atualizado`,
          html,
        });
      }
    } catch (err) {
      console.error("[ROLE][EMAIL] Erro ao enviar e-mail de cargo atualizado:", err);
    }

    return updated;
  }

  async removeMember(adminUserId: string, ongId: string, memberId: string) {
    const adminMembership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId: adminUserId,
          ongId,
        },
      },
    });

    if (!adminMembership || adminMembership.role !== "admin" || !adminMembership.active) {
      throw new AppError("Apenas administradores podem inativar membros.", 403);
    }

    const targetMember = await prisma.userOng.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.ongId !== ongId || !targetMember.active) {
      throw new AppError("Membro ativo não encontrado nesta ONG.", 404);
    }

    // Se o membro for admin, impedir a inativação se for o único admin ativo
    if (targetMember.role === "admin") {
      const adminCount = await prisma.userOng.count({
        where: { ongId, role: "admin", active: true },
      });

      if (adminCount <= 1) {
        throw new AppError("Ação bloqueada: A ONG precisa ter pelo menos 1 administrador ativo.", 400);
      }
    }

    // Soft delete: inativa o membro
    await prisma.userOng.update({
      where: { id: memberId },
      data: { active: false },
    });

    return { message: "Membro inativado com sucesso" };
  }

  async generateInviteLink(ongId: string, userId: string) {
    const adminMembership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId,
          ongId,
        },
      },
    });

    if (!adminMembership || adminMembership.role !== "admin" || !adminMembership.active) {
      throw new AppError("Apenas administradores podem gerar links de convite.", 403);
    }

    const token = crypto.randomBytes(16).toString("hex");

    const invite = await prisma.ongInviteToken.create({
      data: {
        ongId,
        token,
      },
    });

    const frontendUrl = env.FRONTEND_URL || "http://localhost:5173";
    const inviteUrl = `${frontendUrl}/join?token=${token}`;

    return {
      inviteUrl,
      token: invite.token,
      createdAt: invite.createdAt,
    };
  }

  async getInviteDetails(token: string) {
    const invite = await prisma.ongInviteToken.findUnique({
      where: { token },
      include: {
        ong: {
          select: { id: true, name: true, description: true, active: true },
        },
      },
    });

    if (!invite || !invite.ong || !invite.ong.active) {
      throw new AppError("Link de convite inválido ou expirado.", 404);
    }

    return {
      ong: invite.ong,
      token: invite.token,
    };
  }

  async acceptInvite(userId: string, token: string) {
    const inviteDetails = await this.getInviteDetails(token);

    const existingMembership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId,
          ongId: inviteDetails.ong.id,
        },
      },
    });

    if (existingMembership) {
      if (!existingMembership.active) {
        await prisma.userOng.update({
          where: { id: existingMembership.id },
          data: { active: true, role: "member" },
        });
        return { message: "Convite aceito! Seu acesso à ONG foi reativado com sucesso.", ongId: inviteDetails.ong.id };
      }
      return { message: "Você já é membro ativo desta ONG.", ongId: inviteDetails.ong.id };
    }

    await prisma.userOng.create({
      data: {
        userId,
        ongId: inviteDetails.ong.id,
        role: "member",
        active: true,
      },
    });

    return { message: "Convite aceito com sucesso! Você agora é membro da ONG.", ongId: inviteDetails.ong.id };
  }

  async getDashboardStats(userId: string, ongId: string) {
    const membership = await prisma.userOng.findUnique({
      where: {
        userId_ongId: {
          userId,
          ongId,
        },
      },
    });

    if (!membership || !membership.active) {
      throw new AppError("Acesso negado. Você não é membro ativo desta ONG.", 403);
    }

    const [
      totalMembers,
      completedTasks,
      pendingTasks,
      totalTasks,
      activeEvents,
      financialTransactions,
    ] = await Promise.all([
      prisma.userOng.count({
        where: { ongId, active: true },
      }),
      prisma.kanbanTask.count({
        where: { ongId, status: "concluido" },
      }),
      prisma.kanbanTask.count({
        where: { ongId, status: { not: "concluido" } },
      }),
      prisma.kanbanTask.count({
        where: { ongId },
      }),
      prisma.event.count({
        where: { ongId, status: "ativo" },
      }),
      prisma.financial.findMany({
        where: { ongId },
        select: { type: true, amount: true, status: true },
      }),
    ]);

    let totalReceitas = 0;
    let totalDespesas = 0;

    for (const t of financialTransactions) {
      const amount = Number(t.amount);
      if (t.type === "receita") {
        totalReceitas += amount;
      } else if (t.type === "despesa") {
        totalDespesas += amount;
      }
    }

    return {
      totalMembers,
      completedTasks,
      pendingTasks,
      totalTasks,
      activeEvents,
      financial: {
        totalReceitas,
        totalDespesas,
        balance: totalReceitas - totalDespesas,
        totalTransactions: financialTransactions.length,
      },
    };
  }
}

