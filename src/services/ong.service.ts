import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { CreateOngInput, CreateVolunteerInput, AddMemberInput } from "../interfaces/ong.interface.js";
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

  async getUserOngs(userId: string) {
    const userOngs = await prisma.userOng.findMany({
      where: { userId },
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

    const ong = await prisma.ong.findUnique({
      where: { id: ongId },
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
      throw new AppError("ONG não encontrada.", 404);
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

    await prisma.userOng.delete({
      where: { id: memberId },
    });

    return { message: "Membro removido com sucesso" };
  }
}
