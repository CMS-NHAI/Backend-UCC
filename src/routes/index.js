import express from "express";
import uccRoutes from "../routes/uccRoutes.js";

const router = express.Router();

router.use("/ucc", uccRoutes);

export default router;
