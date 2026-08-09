import { Request, Response, NextFunction } from "express";
import { FinancialService } from "../services/financial.service.js";
import {
  createFinancialSchema,
  updateFinancialSchema,
  listFinancialQuerySchema,
  summaryFinancialQuerySchema,
} from "../interfaces/financial.interface.js";

const financialService = new FinancialService();

export class FinancialController {
  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.ongId;
      const data = createFinancialSchema.parse(req.body);
      const transaction = await financialService.createTransaction(req.user!.id, ongId, data);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.ongId;
      const query = listFinancialQuerySchema.parse(req.query);
      const result = await financialService.listTransactions(req.user!.id, ongId, query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.ongId;
      const query = summaryFinancialQuerySchema.parse(req.query);
      const summary = await financialService.getSummary(req.user!.id, ongId, query);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, id } = req.params;
      const data = updateFinancialSchema.parse(req.body);
      const updated = await financialService.updateTransaction(req.user!.id, ongId, id, data);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, id } = req.params;
      const result = await financialService.deleteTransaction(req.user!.id, ongId, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
