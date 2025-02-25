import express from "express";
import uccRoutes from "../routes/uccRoutes.js";

const router = express.Router();

router.use("/api", uccRoutes);

export default router;
