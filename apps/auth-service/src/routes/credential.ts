import { Router } from "express";
import { login, signUp } from "../controllers/auth";
import {
  addDatabaseCredentials,
  deleteDatabaseCredentials,
  getDatabaseCredentials,
  getDatabaseCredentialsById,
} from "../controllers/credential";

const router = Router();

router.post("/add", addDatabaseCredentials);
router.get("/credential", getDatabaseCredentialsById);
router.get("/credentials", getDatabaseCredentials);
router.delete("/credential", deleteDatabaseCredentials);
router.put("/credential", addDatabaseCredentials);

export default router;
