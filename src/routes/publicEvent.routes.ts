import { Router } from "express";
import { EventController } from "../controllers/event.controller.js";

const router = Router();
const eventController = new EventController();

/**
 * @openapi
 * /events/public/landing/{eventId}:
 *   get:
 *     summary: Obter dados públicos para renderização da Landing Page do evento
 *     tags: [Eventos / Público]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do evento, ONG e configurações de template da Landing Page.
 *       404:
 *         description: Evento não encontrado ou sem Landing Page ativada.
 */
router.get("/landing/:eventId", eventController.getPublicLandingPage);

/**
 * @openapi
 * /events/public/{token}:
 *   get:
 *     summary: Obter detalhes públicos do evento pelo link de convite
 *     tags: [Eventos / Público]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do evento e vagas disponíveis.
 *       404:
 *         description: Convite ou evento não encontrado ou inativo.
 */
router.get("/:token", eventController.getPublicEvent);

/**
 * @openapi
 * /events/public/{token}/register:
 *   post:
 *     summary: Inscrição pública de convidado para o evento
 *     tags: [Eventos / Público]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inscrição confirmada com emissão de ingresso digital.
 *       400:
 *         description: Ingressos esgotados ou e-mail já cadastrado.
 */
router.post("/:token/register", eventController.registerPublicGuest);

export default router;
