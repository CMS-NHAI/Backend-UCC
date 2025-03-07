import express from "express";
const router = express.Router()
import { getProgram } from "../controllers/programController.js";
import { validateToken } from "../middlewares/validateToken.js";

router.get('/program/list', validateToken, getProgram);

export default router;