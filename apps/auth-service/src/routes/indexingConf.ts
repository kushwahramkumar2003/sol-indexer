import express from "express";
import {
  createIndexingConfiguration,
  deleteIndexingConfiguration,
  getAllIndexingConfiguration,
  getByIdIndexingConfiguration,
  getSyncStatsIndexingConfiguration,
  toggleEnabledIndexingConfiguration,
  updateIndexingConfiguration,
} from "../controllers/indexingConf";

const router = express.Router();


router.get("/", getAllIndexingConfiguration);

router.get("/:id", getByIdIndexingConfiguration);

router.post("/", createIndexingConfiguration);

router.put("/:id", updateIndexingConfiguration);

router.patch("/:id/toggle", toggleEnabledIndexingConfiguration);

router.delete("/:id", deleteIndexingConfiguration);

router.get("/:id/stats", getSyncStatsIndexingConfiguration);

export default router;
