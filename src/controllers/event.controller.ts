import { Request, Response, NextFunction } from "express";
import { EventService } from "../services/event.service.js";
import {
  createEventSchema,
  updateEventSchema,
  registerGuestSchema,
  updateGuestStatusSchema,
} from "../interfaces/event.interface.js";

const eventService = new EventService();

export class EventController {
  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId } = req.params;
      const data = createEventSchema.parse(req.body);
      const event = await eventService.createEvent(req.user!.id, ongId, data);
      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  }

  async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId } = req.params;
      const events = await eventService.getEvents(req.user!.id, ongId);
      res.status(200).json(events);
    } catch (error) {
      next(error);
    }
  }

  async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, eventId } = req.params;
      const event = await eventService.getEventById(req.user!.id, ongId, eventId);
      res.status(200).json(event);
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, eventId } = req.params;
      const data = updateEventSchema.parse(req.body);
      const updatedEvent = await eventService.updateEvent(req.user!.id, ongId, eventId, data);
      res.status(200).json(updatedEvent);
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, eventId } = req.params;
      const result = await eventService.deleteEvent(req.user!.id, ongId, eventId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getEventGuests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, eventId } = req.params;
      const { search, status } = req.query;
      const guests = await eventService.getEventGuests(
        req.user!.id,
        ongId,
        eventId,
        search as string | undefined,
        status as string | undefined
      );
      res.status(200).json(guests);
    } catch (error) {
      next(error);
    }
  }

  async updateGuestStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, eventId, guestId } = req.params;
      const data = updateGuestStatusSchema.parse(req.body);
      const guest = await eventService.updateGuestStatus(
        req.user!.id,
        ongId,
        eventId,
        guestId,
        data
      );
      res.status(200).json(guest);
    } catch (error) {
      next(error);
    }
  }

  async deleteGuest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ongId, eventId, guestId } = req.params;
      const result = await eventService.deleteGuest(
        req.user!.id,
        ongId,
        eventId,
        guestId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // PÚBLICO
  // ============================================

  async getPublicEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const event = await eventService.getPublicEvent(token);
      res.status(200).json(event);
    } catch (error) {
      next(error);
    }
  }

  async registerPublicGuest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const data = registerGuestSchema.parse(req.body);
      const result = await eventService.registerPublicGuest(token, data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
