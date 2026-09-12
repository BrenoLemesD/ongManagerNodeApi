import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { sendMailSafe } from "../config/mail.js";
import { eventTicketEmailTemplate } from "../templates/emails/eventTicket.template.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
  CreateEventInput,
  UpdateEventInput,
  RegisterGuestInput,
  UpdateGuestStatusInput,
} from "../interfaces/event.interface.js";

export class EventService {
  private getInviteUrl(token: string): string {
    const frontendUrl = env.FRONTEND_URL || "http://localhost:5173";
    return `${frontendUrl}/events/invite/${token}`;
  }

  private getLandingPageUrl(eventId: string): string {
    const frontendUrl = env.FRONTEND_URL || "http://localhost:5173";
    return `${frontendUrl}/eventos/${eventId}`;
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

  async createEvent(userId: string, ongId: string, data: CreateEventInput) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin") {
      throw new AppError("Apenas administradores podem cadastrar eventos.", 403);
    }

    const inviteToken = crypto.randomBytes(12).toString("hex");

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        location: data.location,
        maxTickets: data.maxTickets,
        status: "ativo",
        inviteToken,
        hasLandingPage: data.hasLandingPage ?? false,
        landingTemplate: data.landingTemplate ?? "modern",
        primaryColor: data.primaryColor ?? "#7c3aed",
        bannerUrl: data.bannerUrl,
        ctaText: data.ctaText ?? "Garantir meu Ingresso",
        ongId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { guests: true },
        },
      },
    });

    return {
      ...event,
      totalGuests: 0,
      checkedInGuests: 0,
      remainingTickets: event.maxTickets,
      isSoldOut: false,
      inviteUrl: this.getInviteUrl(event.inviteToken),
      landingPageUrl: event.hasLandingPage ? this.getLandingPageUrl(event.id) : null,
    };
  }

  async getEvents(userId: string, ongId: string) {
    await this.getMembership(userId, ongId);

    const events = await prisma.event.findMany({
      where: { ongId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        guests: {
          select: { id: true, status: true },
        },
      },
      orderBy: { date: "asc" },
    });

    return events.map((event) => {
      const activeGuests = event.guests.filter((g) => g.status !== "cancelado");
      const checkedInGuests = event.guests.filter((g) => g.status === "presente").length;
      const totalGuests = activeGuests.length;
      const remainingTickets = Math.max(0, event.maxTickets - totalGuests);
      const isSoldOut = totalGuests >= event.maxTickets;

      const { guests, ...eventWithoutGuests } = event;

      return {
        ...eventWithoutGuests,
        totalGuests,
        checkedInGuests,
        remainingTickets,
        isSoldOut,
        inviteUrl: this.getInviteUrl(event.inviteToken),
        landingPageUrl: event.hasLandingPage ? this.getLandingPageUrl(event.id) : null,
      };
    });
  }

  async getEventById(userId: string, ongId: string, eventId: string) {
    await this.getMembership(userId, ongId);

    const event = await prisma.event.findFirst({
      where: { id: eventId, ongId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        guests: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event) {
      throw new AppError("Evento não encontrado.", 404);
    }

    const activeGuests = event.guests.filter((g) => g.status !== "cancelado");
    const checkedInGuests = event.guests.filter((g) => g.status === "presente").length;
    const totalGuests = activeGuests.length;
    const remainingTickets = Math.max(0, event.maxTickets - totalGuests);
    const isSoldOut = totalGuests >= event.maxTickets;

    return {
      ...event,
      totalGuests,
      checkedInGuests,
      remainingTickets,
      isSoldOut,
      inviteUrl: this.getInviteUrl(event.inviteToken),
      landingPageUrl: event.hasLandingPage ? this.getLandingPageUrl(event.id) : null,
    };
  }

  async updateEvent(
    userId: string,
    ongId: string,
    eventId: string,
    data: UpdateEventInput
  ) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin") {
      throw new AppError("Apenas administradores podem editar eventos.", 403);
    }

    const existingEvent = await prisma.event.findFirst({
      where: { id: eventId, ongId },
      include: {
        guests: {
          where: { status: { not: "cancelado" } },
        },
      },
    });

    if (!existingEvent) {
      throw new AppError("Evento não encontrado.", 404);
    }

    if (data.maxTickets !== undefined && data.maxTickets < existingEvent.guests.length) {
      throw new AppError(
        `A nova cota de ingressos (${data.maxTickets}) não pode ser menor que os ingressos já ocupados (${existingEvent.guests.length}).`,
        400
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: data.title ?? existingEvent.title,
        description: data.description !== undefined ? data.description : existingEvent.description,
        date: data.date ? new Date(data.date) : existingEvent.date,
        location: data.location !== undefined ? data.location : existingEvent.location,
        maxTickets: data.maxTickets ?? existingEvent.maxTickets,
        status: data.status ?? existingEvent.status,
        hasLandingPage: data.hasLandingPage !== undefined ? data.hasLandingPage : existingEvent.hasLandingPage,
        landingTemplate: data.landingTemplate !== undefined ? data.landingTemplate : existingEvent.landingTemplate,
        primaryColor: data.primaryColor !== undefined ? data.primaryColor : existingEvent.primaryColor,
        bannerUrl: data.bannerUrl !== undefined ? data.bannerUrl : existingEvent.bannerUrl,
        ctaText: data.ctaText !== undefined ? data.ctaText : existingEvent.ctaText,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const activeGuestsCount = existingEvent.guests.length;

    return {
      ...updatedEvent,
      totalGuests: activeGuestsCount,
      remainingTickets: Math.max(0, updatedEvent.maxTickets - activeGuestsCount),
      isSoldOut: activeGuestsCount >= updatedEvent.maxTickets,
      inviteUrl: this.getInviteUrl(updatedEvent.inviteToken),
      landingPageUrl: updatedEvent.hasLandingPage ? this.getLandingPageUrl(updatedEvent.id) : null,
    };
  }

  async deleteEvent(userId: string, ongId: string, eventId: string) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin") {
      throw new AppError("Apenas administradores podem excluir eventos.", 403);
    }

    const existingEvent = await prisma.event.findFirst({
      where: { id: eventId, ongId },
    });

    if (!existingEvent) {
      throw new AppError("Evento não encontrado.", 404);
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return { message: "Evento excluído com sucesso." };
  }

  async getEventGuests(
    userId: string,
    ongId: string,
    eventId: string,
    search?: string,
    status?: string
  ) {
    await this.getMembership(userId, ongId);

    const event = await prisma.event.findFirst({
      where: { id: eventId, ongId },
    });

    if (!event) {
      throw new AppError("Evento não encontrado.", 404);
    }

    const whereClause: any = {
      eventId,
    };

    if (status && status !== "todos") {
      whereClause.status = status;
    }

    if (search && search.trim() !== "") {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
        { ticketCode: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const guests = await prisma.eventGuest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return guests;
  }

  async updateGuestStatus(
    userId: string,
    ongId: string,
    eventId: string,
    guestId: string,
    data: UpdateGuestStatusInput
  ) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin") {
      throw new AppError("Apenas administradores podem alterar o status de convidados.", 403);
    }

    const guest = await prisma.eventGuest.findFirst({
      where: { id: guestId, eventId, event: { ongId } },
    });

    if (!guest) {
      throw new AppError("Inscrição de convidado não encontrada.", 404);
    }

    const updatedGuest = await prisma.eventGuest.update({
      where: { id: guestId },
      data: { status: data.status },
    });

    return updatedGuest;
  }

  async deleteGuest(
    userId: string,
    ongId: string,
    eventId: string,
    guestId: string
  ) {
    const membership = await this.getMembership(userId, ongId);

    if (membership.role !== "admin") {
      throw new AppError("Apenas administradores podem remover convidados.", 403);
    }

    const guest = await prisma.eventGuest.findFirst({
      where: { id: guestId, eventId, event: { ongId } },
    });

    if (!guest) {
      throw new AppError("Inscrição de convidado não encontrada.", 404);
    }

    await prisma.eventGuest.delete({
      where: { id: guestId },
    });

    return { message: "Inscrição removida com sucesso. Vaga liberada." };
  }

  // ============================================
  // MÉTODOS PÚBLICOS (Para convidados / participantes / Landing Pages)
  // ============================================

  async getPublicEvent(inviteToken: string) {
    const event = await prisma.event.findUnique({
      where: { inviteToken },
      include: {
        ong: {
          select: { id: true, name: true, description: true, active: true },
        },
        guests: {
          where: { status: { not: "cancelado" } },
          select: { id: true },
        },
      },
    });

    if (!event || !event.ong || !event.ong.active) {
      throw new AppError("Convite ou evento não encontrado ou inativo.", 404);
    }

    const totalGuests = event.guests.length;
    const remainingTickets = Math.max(0, event.maxTickets - totalGuests);
    const isSoldOut = totalGuests >= event.maxTickets;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      maxTickets: event.maxTickets,
      totalGuests,
      remainingTickets,
      isSoldOut,
      status: event.status,
      inviteToken: event.inviteToken,
      hasLandingPage: event.hasLandingPage,
      landingTemplate: event.landingTemplate,
      primaryColor: event.primaryColor,
      bannerUrl: event.bannerUrl,
      ctaText: event.ctaText,
      landingPageUrl: event.hasLandingPage ? this.getLandingPageUrl(event.id) : null,
      ong: {
        id: event.ong.id,
        name: event.ong.name,
        description: event.ong.description,
      },
    };
  }

  async getPublicLandingPage(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ong: {
          select: { id: true, name: true, description: true, active: true },
        },
        guests: {
          where: { status: { not: "cancelado" } },
          select: { id: true },
        },
      },
    });

    if (!event || !event.ong || !event.ong.active) {
      throw new AppError("Evento não encontrado ou inativo.", 404);
    }

    if (!event.hasLandingPage) {
      throw new AppError("Este evento não possui página de divulgação pública habilitada.", 404);
    }

    const totalGuests = event.guests.length;
    const remainingTickets = Math.max(0, event.maxTickets - totalGuests);
    const isSoldOut = totalGuests >= event.maxTickets;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      maxTickets: event.maxTickets,
      totalGuests,
      remainingTickets,
      isSoldOut,
      status: event.status,
      inviteToken: event.inviteToken,
      hasLandingPage: event.hasLandingPage,
      landingTemplate: event.landingTemplate || "modern",
      primaryColor: event.primaryColor || "#7c3aed",
      bannerUrl: event.bannerUrl,
      ctaText: event.ctaText || "Garantir meu Ingresso",
      ong: {
        id: event.ong.id,
        name: event.ong.name,
        description: event.ong.description,
      },
    };
  }

  async registerPublicGuest(inviteToken: string, data: RegisterGuestInput) {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { inviteToken },
        include: {
          ong: {
            select: { id: true, name: true, active: true },
          },
        },
      });

      if (!event || !event.ong || !event.ong.active) {
        throw new AppError("Evento não encontrado ou inativo.", 404);
      }

      if (event.status !== "ativo") {
        throw new AppError(`Este evento está ${event.status} e não aceita mais inscrições.`, 400);
      }

      const existingRegistration = await tx.eventGuest.findUnique({
        where: {
          eventId_email: {
            eventId: event.id,
            email: data.email.toLowerCase().trim(),
          },
        },
      });

      if (existingRegistration) {
        if (existingRegistration.status !== "cancelado") {
          throw new AppError("Este endereço de e-mail já está cadastrado para este evento.", 400);
        }
        const updated = await tx.eventGuest.update({
          where: { id: existingRegistration.id },
          data: {
            name: data.name.trim(),
            phone: data.phone?.trim() || null,
            status: "confirmado",
          },
        });

        return {
          guest: updated,
          event: {
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            ongName: event.ong.name,
          },
        };
      }

      const activeCount = await tx.eventGuest.count({
        where: {
          eventId: event.id,
          status: { not: "cancelado" },
        },
      });

      if (activeCount >= event.maxTickets) {
        throw new AppError("Ingressos esgotados! Todas as vagas já foram preenchidas.", 400);
      }

      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
      const ticketCode = `EVT-${randomSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;

      const guest = await tx.eventGuest.create({
        data: {
          eventId: event.id,
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          phone: data.phone?.trim() || null,
          ticketCode,
          status: "confirmado",
        },
      });

      return {
        guest,
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
          ongName: event.ong.name,
        },
      };
    });

    // Envio seguro do ingresso por e-mail para o participante
    try {
      const dateFormatted = new Date(result.event.date).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "full",
        timeStyle: "short",
      });

      const eventUrl = `${env.FRONTEND_URL || "http://localhost:5173"}/eventos/${result.event.id}`;

      const html = eventTicketEmailTemplate({
        guestName: result.guest.name,
        ongName: result.event.ongName,
        eventTitle: result.event.title,
        eventDate: dateFormatted,
        eventLocation: result.event.location,
        ticketCode: result.guest.ticketCode,
        eventUrl,
      });

      sendMailSafe({
        to: result.guest.email,
        subject: `[Ingresso Confirmado] ${result.event.title} - ${result.event.ongName}`,
        html,
      });
    } catch (err) {
      console.error("[EVENT][EMAIL] Erro ao enviar ingresso por e-mail:", err);
    }

    return result;
  }
}
