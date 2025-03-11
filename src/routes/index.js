import express from "express";
import uccRoutes from "../routes/uccRoutes.js";
import stretchRoutes from "../routes/stretchRoutes.js";
import supportingDocRoutes from "../routes/supportingDocRoutes.js"
import programRoutes from "../routes/programRoutes.js"
import phaseRoutes from "../routes/phaseRoutes.js"
import contractRoutes from "../routes/contractRoutes.js"

const router = express.Router();

router.use("/api", uccRoutes);
router.use("/api", stretchRoutes);
router.use("/api", supportingDocRoutes)
router.use("/api", programRoutes)
router.use("/api", phaseRoutes)
router.use("/api", contractRoutes)
export default router;
