import { Router } from "express";
import { FinancialController } from "../controllers/financial.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });
const financialController = new FinancialController();

router.use(authMiddleware);

/**
 * @openapi
 * /ong/{ongId}/financial:
 *   post:
 *     summary: Criar novo lançamento financeiro (Admin ou Finance Manager)
 *     tags: [Financeiro]
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
 *             required: [type, amount, description, category, date]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [receita, despesa]
 *               amount:
 *                 type: number
 *                 example: 1500.50
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [pendente, confirmado]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lançamento criado.
 *   get:
 *     summary: Listar lançamentos financeiros da ONG com filtros e paginação
 *     tags: [Financeiro]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ongId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [receita, despesa]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista paginada de lançamentos financeiros.
 */
router.post("/", financialController.createTransaction);
router.get("/", financialController.listTransactions);

/**
 * @openapi
 * /ong/{ongId}/financial/summary:
 *   get:
 *     summary: Obter resumo financeiro (Total Receitas, Despesas e Saldo)
 *     tags: [Financeiro]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ongId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Métricas financeiras e saldo da ONG.
 */
router.get("/summary", financialController.getSummary);

/**
 * @openapi
 * /ong/{ongId}/financial/{id}:
 *   put:
 *     summary: Editar lançamento financeiro (Admin)
 *     tags: [Financeiro]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lançamento atualizado.
 *   delete:
 *     summary: Excluir lançamento financeiro (Admin)
 *     tags: [Financeiro]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lançamento excluído.
 */
router.put("/:id", financialController.updateTransaction);
router.delete("/:id", financialController.deleteTransaction);

export default router;
