import { Router } from "express";
import authRoutes from "./auth.routes.js";
import ongRoutes from "./ong.routes.js";
import kanbanRoutes from "./kanban.routes.js";
import financialRoutes from "./financial.routes.js";
import eventRoutes from "./event.routes.js";
import publicEventRoutes from "./publicEvent.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/ong", ongRoutes);
router.use("/ong/:ongId/kanban", kanbanRoutes);
router.use("/ong/:ongId/financial", financialRoutes);
router.use("/ong/:ongId/events", eventRoutes);
router.use("/events/public", publicEventRoutes);

export default router;

