import { Router } from "express";
import { OngController } from "../controllers/ong.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
const ongController = new OngController();

router.use(authMiddleware);

/**
 * @openapi
 * /ong:
 *   post:
 *     summary: Criar nova ONG
 *     tags: [ONGs]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: ONG criada com sucesso. Usuário torna-se admin.
 *   get:
 *     summary: Listar todas as ONGs do usuário logado
 *     tags: [ONGs]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ONGs vinculadas.
 */
router.post("/", ongController.createOng);
router.get("/", ongController.getUserOngs);

/**
 * @openapi
 * /ong/{id}:
 *   get:
 *     summary: Obter detalhes de uma ONG e papel do usuário logado nela
 *     tags: [ONGs]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados detalhados da ONG e lista de membros.
 *       403:
 *         description: Usuário não pertence a esta ONG.
 */
router.get("/:id", ongController.getOngById);

/**
 * @openapi
 * /ong/{id}/members:
 *   get:
 *     summary: Listar membros de uma ONG
 *     tags: [ONGs / Voluntários]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Membros cadastrados.
 *   post:
 *     summary: Adicionar membro existente a uma ONG (Admin)
 *     tags: [ONGs / Voluntários]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Membro vinculado.
 */
router.get("/:id/members", ongController.getOngMembers);
router.post("/:id/members", ongController.addMember);

/**
 * @openapi
 * /ong/{id}/volunteers:
 *   post:
 *     summary: Cadastrar voluntário para a ONG (Admin)
 *     tags: [ONGs / Voluntários]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Voluntário cadastrado e associado à ONG com sucesso.
 */
router.post("/:id/volunteers", ongController.createVolunteer);

/**
 * @openapi
 * /ong/{id}/members/{memberId}:
 *   delete:
 *     summary: Remover membro da ONG (Admin)
 *     tags: [ONGs / Voluntários]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Membro removido.
 */
router.delete("/:id/members/:memberId", ongController.removeMember);

export default router;
