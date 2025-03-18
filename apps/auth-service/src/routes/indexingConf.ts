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

// GET all configurations for the authenticated user
router.get("/", getAllIndexingConfiguration);

// GET a specific configuration by ID
router.get("/:id", getByIdIndexingConfiguration);

// POST create a new configuration
router.post("/", createIndexingConfiguration);

// PUT update an existing configuration
router.put("/:id", updateIndexingConfiguration);

// PATCH toggle enabled status
router.patch("/:id/toggle", toggleEnabledIndexingConfiguration);

// DELETE a configuration
router.delete("/:id", deleteIndexingConfiguration);

// GET sync statistics for a configuration
router.get("/:id/stats", getSyncStatsIndexingConfiguration);

export default router;
