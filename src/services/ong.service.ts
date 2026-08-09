import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { CreateOngInput, UpdateOngInput, CreateVolunteerInput, AddMemberInput, UpdateMemberRoleInput } from "../interfaces/ong.interface.js";
import { AppError } from "../middlewares/error.middleware.js";

export class OngService {
  async createOng(userId: string, data: CreateOngInput) {
    const ong = await prisma.ong.create({
      data: {
        name: data.name,
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

    if (!membership) {
      throw new AppError("Acesso negado. Você não pertence a esta ONG.", 403);
    }

    const ong = await prisma.ong.findFirst({
      where: { id: ongId, active: true },
      include: {
        members: {
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

    if (!membership) {
      throw new AppError("Acesso negado. Você não pertence a esta ONG.", 403);
    }

    const members = await prisma.userOng.findMany({
      where: { ongId },
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
      throw new AppError("Este usuário já é membro desta ONG.", 400);
    }

    const membership = await prisma.userOng.create({
      data: {
        userId: user.id,
        ongId,
        role: "member",
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

    if (!adminMembership || adminMembership.role !== "admin") {
      throw new AppError("Apenas administradores podem adicionar membros.", 403);
    }

    const membership = await prisma.userOng.create({
      data: {
        userId: data.userId,
        ongId,
        role: data.role,
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

    if (!adminMembership || adminMembership.role !== "admin") {
      throw new AppError("Apenas administradores podem alterar funções de membros.", 403);
    }

    const targetMember = await prisma.userOng.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.ongId !== ongId) {
      throw new AppError("Membro não encontrado nesta ONG.", 404);
    }

    // Se estiver rebaixando um admin, verificar se há pelo menos 1 outro admin
    if (targetMember.role === "admin" && newRole !== "admin") {
      const adminCount = await prisma.userOng.count({
        where: { ongId, role: "admin" },
      });

      if (adminCount <= 1) {
        throw new AppError("Não é possível alterar a função do único administrador da ONG.", 400);
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

    if (!adminMembership || adminMembership.role !== "admin") {
      throw new AppError("Apenas administradores podem remover membros.", 403);
    }

    const targetMember = await prisma.userOng.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.ongId !== ongId) {
      throw new AppError("Membro não encontrado nesta ONG.", 404);
    }

    // Se o membro for admin, impedir a remoção se for o único admin
    if (targetMember.role === "admin") {
      const adminCount = await prisma.userOng.count({
        where: { ongId, role: "admin" },
      });

      if (adminCount <= 1) {
        throw new AppError("Ação bloqueada: A ONG precisa ter pelo menos 1 administrador ativo.", 400);
      }
    }

    await prisma.userOng.delete({
      where: { id: memberId },
    });

    return { message: "Membro removido com sucesso" };
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

    if (!adminMembership || adminMembership.role !== "admin") {
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
      return { message: "Usuário já é membro desta ONG.", ongId: inviteDetails.ong.id };
    }

    await prisma.userOng.create({
      data: {
        userId,
        ongId: inviteDetails.ong.id,
        role: "member",
      },
    });

    return { message: "Convite aceito com sucesso! Você agora é membro da ONG.", ongId: inviteDetails.ong.id };
  }
}
