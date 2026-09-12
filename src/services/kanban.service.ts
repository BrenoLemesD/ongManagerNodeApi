import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { sendMailSafe } from "../config/mail.js";
import { taskCompletedEmailTemplate } from "../templates/emails/taskCompleted.template.js";
import { taskAssignedEmailTemplate } from "../templates/emails/taskAssigned.template.js";
import { CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput } from "../interfaces/kanban.interface.js";
import { AppError } from "../middlewares/error.middleware.js";

export class KanbanService {
  private async notifyAdminsTaskCompleted(ongId: string, task: any, actorUserId: string) {
    try {
      const [admins, actor, ong] = await Promise.all([
        prisma.userOng.findMany({
          where: { ongId, role: "admin", active: true },
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        prisma.user.findUnique({
          where: { id: actorUserId },
          select: { name: true, email: true },
        }),
        prisma.ong.findUnique({
          where: { id: ongId },
          select: { name: true },
        }),
      ]);

      const nowFormatted = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "short",
      });

      const ongName = ong?.name || "Sua ONG";
      const completedByName = actor?.name || "Membro da ONG";
      const completedByEmail = actor?.email || "";
      const boardUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/kanban`;

      for (const adminMembership of admins) {
        if (adminMembership.user?.email) {
          const html = taskCompletedEmailTemplate({
            adminName: adminMembership.user.name,
            ongName,
            taskTitle: task.title,
            taskDescription: task.description,
            completedByName,
            completedByEmail,
            completedAt: nowFormatted,
            taskPriority: task.priority,
            boardUrl,
          });

          sendMailSafe({
            to: adminMembership.user.email,
            subject: `[Concluída] ${task.title} - ${ongName}`,
            html,
          });
        }
      }
    } catch (err) {
      console.error("[KANBAN][EMAIL] Erro ao notificar administradores sobre tarefa concluída:", err);
    }
  }

  private async notifyUserTaskAssigned(ongId: string, task: any, assignedByUserId: string) {
    try {
      if (!task.assignedTo?.email) return;

      const [assignedBy, ong] = await Promise.all([
        prisma.user.findUnique({
          where: { id: assignedByUserId },
          select: { name: true },
        }),
        prisma.ong.findUnique({
          where: { id: ongId },
          select: { name: true },
        }),
      ]);

      const deadlineFormatted = task.deadline
        ? new Date(task.deadline).toLocaleDateString("pt-BR")
        : null;

      const ongName = ong?.name || "Sua ONG";
      const boardUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/kanban`;

      const html = taskAssignedEmailTemplate({
        userName: task.assignedTo.name,
        ongName,
        taskTitle: task.title,
        taskDescription: task.description,
        priority: task.priority,
        deadline: deadlineFormatted,
        assignedByName: assignedBy?.name || "Administrador",
        boardUrl,
      });

      sendMailSafe({
        to: task.assignedTo.email,
        subject: `[Nova Tarefa] ${task.title} - ${ongName}`,
        html,
      });
    } catch (err) {
      console.error("[KANBAN][EMAIL] Erro ao notificar usuário sobre tarefa atribuída:", err);
    }
  }

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

  private async resolveAssignedUserId(assignedToId: string | null | undefined, ongId: string): Promise<string | null> {
    if (!assignedToId || assignedToId.trim() === "") {
      return null;
    }

    const userDirect = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (userDirect) {
      const membership = await prisma.userOng.findUnique({
        where: {
          userId_ongId: {
            userId: userDirect.id,
            ongId,
          },
        },
      });

      if (!membership) {
        throw new AppError("O usuário atribuído não pertence a esta ONG.", 400);
      }

      return userDirect.id;
    }

    const userOng = await prisma.userOng.findUnique({
      where: { id: assignedToId },
    });

    if (userOng && userOng.ongId === ongId) {
      return userOng.userId;
    }

    throw new AppError("Usuário responsável não encontrado na ONG.", 404);
  }

  async createTask(userId: string, ongId: string, data: CreateTaskInput) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin") {
      throw new AppError("Apenas administradores podem criar tarefas.", 403);
    }

    const resolvedAssignedUserId = await this.resolveAssignedUserId(data.assignedToId, ongId);

    const task = await prisma.kanbanTask.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: "a_fazer",
        deadline: data.deadline ? new Date(data.deadline) : null,
        ongId,
        createdById: userId,
        assignedToId: resolvedAssignedUserId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        actorUserId: userId,
        action: "created",
        newStatus: "a_fazer",
      },
    });

    if (task.assignedToId && task.assignedTo) {
      this.notifyUserTaskAssigned(ongId, task, userId);
    }

    return task;
  }

  async getTasks(userId: string, ongId: string) {
    await this.getMembership(userId, ongId);

    const tasks = await prisma.kanbanTask.findMany({
      where: { ongId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { priority: "desc" },
        { deadline: "asc" },
        { createdAt: "desc" },
      ],
    });

    return tasks;
  }

  async getTaskById(userId: string, ongId: string, taskId: string) {
    await this.getMembership(userId, ongId);

    const task = await prisma.kanbanTask.findFirst({
      where: { id: taskId, ongId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        history: {
          include: {
            actor: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      throw new AppError("Tarefa não encontrada.", 404);
    }

    return task;
  }

  async updateTask(userId: string, ongId: string, taskId: string, data: UpdateTaskInput) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin") {
      throw new AppError("Apenas administradores podem editar tarefas.", 403);
    }

    const existingTask = await prisma.kanbanTask.findFirst({
      where: { id: taskId, ongId },
    });

    if (!existingTask) {
      throw new AppError("Tarefa não encontrada.", 404);
    }

    const resolvedAssignedUserId = data.assignedToId !== undefined
      ? await this.resolveAssignedUserId(data.assignedToId, ongId)
      : existingTask.assignedToId;

    const updatedTask = await prisma.kanbanTask.update({
      where: { id: taskId },
      data: {
        title: data.title !== undefined ? data.title : existingTask.title,
        description: data.description !== undefined ? data.description : existingTask.description,
        priority: data.priority !== undefined ? data.priority : existingTask.priority,
        status: data.status !== undefined ? data.status : existingTask.status,
        deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : existingTask.deadline,
        assignedToId: resolvedAssignedUserId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.taskHistory.create({
      data: {
        taskId: taskId,
        actorUserId: userId,
        action: "updated",
        previousStatus: existingTask.status,
        newStatus: updatedTask.status,
      },
    });

    // Se mudou o responsável, avisa o novo responsável
    if (updatedTask.assignedToId && updatedTask.assignedToId !== existingTask.assignedToId) {
      this.notifyUserTaskAssigned(ongId, updatedTask, userId);
    }

    // Se mudou o status para concluído, avisa todos os admins da ONG
    if (updatedTask.status === "concluido" && existingTask.status !== "concluido") {
      this.notifyAdminsTaskCompleted(ongId, updatedTask, userId);
    }

    return updatedTask;
  }

  async updateTaskStatus(userId: string, ongId: string, taskId: string, data: UpdateTaskStatusInput) {
    const membership = await this.getMembership(userId, ongId);

    const existingTask = await prisma.kanbanTask.findFirst({
      where: { id: taskId, ongId },
    });

    if (!existingTask) {
      throw new AppError("Tarefa não encontrada.", 404);
    }

    const isAdmin = membership.role === "admin";

    if (!isAdmin) {
      if (data.status === "concluido") {
        throw new AppError("Apenas administradores podem marcar tarefas como concluídas.", 403);
      }
      if (data.status === "a_fazer") {
        throw new AppError("Voluntários não podem mover tarefas para A Fazer.", 403);
      }
    }

    const updatedTask = await prisma.kanbanTask.update({
      where: { id: taskId },
      data: {
        status: data.status,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        actorUserId: userId,
        action: "status_changed",
        previousStatus: existingTask.status,
        newStatus: data.status,
      },
    });

    // Se mudou o status para concluído, avisa todos os admins da ONG
    if (data.status === "concluido" && existingTask.status !== "concluido") {
      this.notifyAdminsTaskCompleted(ongId, updatedTask, userId);
    }

    return updatedTask;
  }

  async deleteTask(userId: string, ongId: string, taskId: string) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin") {
      throw new AppError("Apenas administradores podem excluir tarefas.", 403);
    }

    const existingTask = await prisma.kanbanTask.findFirst({
      where: { id: taskId, ongId },
    });

    if (!existingTask) {
      throw new AppError("Tarefa não encontrada.", 404);
    }

    await prisma.kanbanTask.delete({
      where: { id: taskId },
    });

    return { message: "Tarefa excluída com sucesso" };
  }
}
