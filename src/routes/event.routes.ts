import { Router } from "express";
import { EventController } from "../controllers/event.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });
const eventController = new EventController();

router.use(authMiddleware);

/**
 * @openapi
 * /ong/{ongId}/events:
 *   post:
 *     summary: Cadastrar novo evento na ONG (Admin)
 *     tags: [Eventos]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ongId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, date, maxTickets]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               maxTickets:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Evento criado com link de convite gerado.
 *   get:
 *     summary: Listar eventos da ONG com estatísticas de ingressos
 *     tags: [Eventos]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ongId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de eventos com cota de ingressos e inscritos.
 */
router.post("/", eventController.createEvent);
router.get("/", eventController.getEvents);

/**
 * @openapi
 * /ong/{ongId}/events/{eventId}:
 *   get:
 *     summary: Detalhes do evento
 *     tags: [Eventos]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ongId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes completos do evento.
 *   put:
 *     summary: Atualizar dados do evento (Admin)
 *     tags: [Eventos]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ongId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evento atualizado com sucesso.
 *   delete:
 *     summary: Excluir evento (Admin)
 *     tags: [Eventos]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ongId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evento excluído.
 */
router.get("/:eventId", eventController.getEventById);
router.put("/:eventId", eventController.updateEvent);
router.delete("/:eventId", eventController.deleteEvent);

/**
 * @openapi
 * /ong/{ongId}/events/{eventId}/guests:
 *   get:
 *     summary: Listar convidados/inscritos do evento (Admin)
 *     tags: [Eventos / Convidados]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ongId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de convidados inscritos.
 */
router.get("/:eventId/guests", eventController.getEventGuests);

/**
 * @openapi
 * /ong/{ongId}/events/{eventId}/guests/{guestId}/status:
 *   patch:
 *     summary: Alterar status do convidado / Check-in de presença (Admin)
 *     tags: [Eventos / Convidados]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ongId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: guestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmado, presente, cancelado]
 *     responses:
 *       200:
 *         description: Status do convidado atualizado.
 */
router.patch("/:eventId/guests/:guestId/status", eventController.updateGuestStatus);

/**
 * @openapi
 * /ong/{ongId}/events/{eventId}/guests/{guestId}:
 *   delete:
 *     summary: Remover inscrição de convidado (Admin)
 *     tags: [Eventos / Convidados]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ongId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: guestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inscrição removida e vaga liberada.
 */
router.delete("/:eventId/guests/:guestId", eventController.deleteGuest);

export default router;
