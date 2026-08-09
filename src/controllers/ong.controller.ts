import { Request, Response, NextFunction } from "express";
import { OngService } from "../services/ong.service.js";
import { createOngSchema, createVolunteerSchema, addMemberSchema } from "../interfaces/ong.interface.js";

const ongService = new OngService();

export class OngController {
  async createOng(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createOngSchema.parse(req.body);
      const ong = await ongService.createOng(req.user!.id, data);
      res.status(201).json(ong);
    } catch (error) {
      next(error);
    }
  }

  async getUserOngs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongs = await ongService.getUserOngs(req.user!.id);
      res.status(200).json(ongs);
    } catch (error) {
      next(error);
    }
  }

  async getOngById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.id;
      const ong = await ongService.getOngById(req.user!.id, ongId);
      res.status(200).json(ong);
    } catch (error) {
      next(error);
    }
  }

  async getOngMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.id;
      const members = await ongService.getOngMembers(req.user!.id, ongId);
      res.status(200).json(members);
    } catch (error) {
      next(error);
    }
  }

  async createVolunteer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.id;
      const data = createVolunteerSchema.parse(req.body);
      const volunteer = await ongService.createVolunteer(req.user!.id, ongId, data);
      res.status(201).json(volunteer);
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.id;
      const data = addMemberSchema.parse(req.body);
      const member = await ongService.addMember(req.user!.id, ongId, data);
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: ongId, memberId } = req.params;
      const result = await ongService.removeMember(req.user!.id, ongId, memberId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
