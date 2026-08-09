import { prisma } from "../config/prisma.js";
import { CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput } from "../interfaces/kanban.interface.js";
import { AppError } from "../middlewares/error.middleware.js";

export class KanbanService {
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

  private async resolveAssignedUserId(assignedToId: string | undefined, ongId: string): Promise<string | null> {
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
