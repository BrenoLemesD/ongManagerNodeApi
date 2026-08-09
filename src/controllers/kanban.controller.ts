import { Request, Response, NextFunction } from "express";
import { KanbanService } from "../services/kanban.service.js";
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from "../interfaces/kanban.interface.js";

const kanbanService = new KanbanService();

export class KanbanController {
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.ongId;
      const data = createTaskSchema.parse(req.body);
      const task = await kanbanService.createTask(req.user!.id, ongId, data);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.ongId;
      const tasks = await kanbanService.getTasks(req.user!.id, ongId);
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, taskId } = req.params;
      const task = await kanbanService.getTaskById(req.user!.id, ongId, taskId);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, taskId } = req.params;
      const data = updateTaskSchema.parse(req.body);
      const task = await kanbanService.updateTask(req.user!.id, ongId, taskId, data);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, taskId } = req.params;
      const data = updateTaskStatusSchema.parse(req.body);
      const task = await kanbanService.updateTaskStatus(req.user!.id, ongId, taskId, data);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, taskId } = req.params;
      const result = await kanbanService.deleteTask(req.user!.id, ongId, taskId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
