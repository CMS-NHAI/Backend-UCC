import express from "express";
const router = express.Router()
import { getPhase } from "../controllers/phaseController.js";
import { validateToken } from "../middlewares/validateToken.js";

router.get('/phase/list', validateToken, getPhase);


export default router;