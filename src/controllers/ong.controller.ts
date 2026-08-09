import { Request, Response, NextFunction } from "express";
import { OngService } from "../services/ong.service.js";
import { createOngSchema, updateOngSchema, createVolunteerSchema, addMemberSchema, updateMemberRoleSchema } from "../interfaces/ong.interface.js";

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

  async updateOng(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.id;
      const data = updateOngSchema.parse(req.body);
      const updated = await ongService.updateOng(ongId, req.user!.id, data);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteOng(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.id;
      const result = await ongService.deleteOng(ongId, req.user!.id);
      res.status(200).json(result);
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

  async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: ongId, memberId } = req.params;
      const data = updateMemberRoleSchema.parse(req.body);
      const updated = await ongService.updateMemberRole(req.user!.id, ongId, memberId, data.role);
      res.status(200).json(updated);
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

  async generateInviteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.params.id;
      const invite = await ongService.generateInviteLink(ongId, req.user!.id);
      res.status(201).json(invite);
    } catch (error) {
      next(error);
    }
  }

  async getInviteDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const invite = await ongService.getInviteDetails(token);
      res.status(200).json(invite);
    } catch (error) {
      next(error);
    }
  }

  async acceptInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const result = await ongService.acceptInvite(req.user!.id, token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
