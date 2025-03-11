import express from "express";
import { validateToken } from "../middlewares/validateToken.js";
import { getUccLogList } from "../controllers/uccLogController.js";
const router = express.Router()

router.get('/log/list', validateToken, getUccLogList)

export default router;
