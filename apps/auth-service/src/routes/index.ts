import { Router } from "express";
import authRoutes from "./auth";
import credentialRoutes from "./credential";
import indexingConfRoutes from "./indexingConf";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/cred", authMiddleware, credentialRoutes);
router.use("/conf", authMiddleware, indexingConfRoutes);

export default router;
