import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
const authController = new AuthController();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registrar novo usuário e opcionalmente criar uma ONG inicial
 *     tags: [Autenticação]
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
 *                 example: João Silva
 *               email:
 *                 type: string
 *                 example: joao@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               ongName:
 *                 type: string
 *                 example: ONG Esperança
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso e cookie de sessão gerado.
 *       400:
 *         description: E-mail já cadastrado ou dados inválidos.
 */
router.post("/register", authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: joao@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Autenticado com sucesso. Cookie JWT definido.
 *       401:
 *         description: Credenciais inválidas.
 */
router.post("/login", authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Retorna os dados do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário.
 *       401:
 *         description: Não autorizado.
 */
router.get("/me", authMiddleware, authController.getMe);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Encerrar sessão e remover cookie de token
 *     tags: [Autenticação]
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso.
 */
router.post("/logout", authController.logout);

export default router;
