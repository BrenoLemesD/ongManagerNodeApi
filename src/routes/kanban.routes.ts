import { Router } from "express";
import { KanbanController } from "../controllers/kanban.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });
const kanbanController = new KanbanController();

router.use(authMiddleware);

/**
 * @openapi
 * /ong/{ongId}/kanban:
 *   post:
 *     summary: Criar nova tarefa no Kanban (Admin)
 *     tags: [Kanban / Tarefas]
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
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [baixa, media, alta, urgente]
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               assignedToId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tarefa criada com sucesso.
 *   get:
 *     summary: Listar todas as tarefas da ONG
 *     tags: [Kanban / Tarefas]
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
 *         description: Lista de tarefas ordenadas por prioridade e prazo.
 */
router.post("/", kanbanController.createTask);
router.get("/", kanbanController.getTasks);

/**
 * @openapi
 * /ong/{ongId}/kanban/{taskId}:
 *   get:
 *     summary: Obter detalhes da tarefa e seu histórico de ações
 *     tags: [Kanban / Tarefas]
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
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes da tarefa com histórico completo.
 *   put:
 *     summary: Atualizar dados da tarefa (Admin)
 *     tags: [Kanban / Tarefas]
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
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tarefa atualizada.
 *   delete:
 *     summary: Excluir tarefa da ONG (Admin)
 *     tags: [Kanban / Tarefas]
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
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tarefa removida.
 */
router.get("/:taskId", kanbanController.getTaskById);
router.put("/:taskId", kanbanController.updateTask);
router.delete("/:taskId", kanbanController.deleteTask);

/**
 * @openapi
 * /ong/{ongId}/kanban/{taskId}/status:
 *   patch:
 *     summary: Alterar status da tarefa (Drag-and-Drop)
 *     tags: [Kanban / Tarefas]
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
 *         name: taskId
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
 *                 enum: [a_fazer, em_andamento, aguardando_aprovacao, concluido]
 *     responses:
 *       200:
 *         description: Status da tarefa alterado e histórico gravado.
 */
router.patch("/:taskId/status", kanbanController.updateTaskStatus);

export default router;
