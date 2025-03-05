import express from "express";
import uccRoutes from "../routes/uccRoutes.js";
import stretchRoutes from "../routes/stretchRoutes.js";

const router = express.Router();

router.use("/api", uccRoutes);
router.use("/api", stretchRoutes);

export default router;
