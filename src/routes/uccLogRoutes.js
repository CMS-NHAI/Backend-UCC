import express from "express";
import { validateToken } from "../middlewares/validateToken.js";
import { getUccLogList, addUccLog } from "../controllers/uccLogController.js";
const router = express.Router()


router.post("/add/log", validateToken, addUccLog)
router.get('/log/list', validateToken, getUccLogList)

export default router;
