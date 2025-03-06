import express from "express";
import uccRoutes from "../routes/uccRoutes.js";
import stretchRoutes from "../routes/stretchRoutes.js";
import supportingDocRoutes from "../routes/supportingDocRoutes.js"

const router = express.Router();

router.use("/api", uccRoutes);
router.use("/api", stretchRoutes);
router.use("/api", supportingDocRoutes)

export default router;
