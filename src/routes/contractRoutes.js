import express from "express";
import { validateToken } from "../middlewares/validateToken.js";
import { updateContractDetails, updateTypeOfWork } from "../controllers/updateContractController.js";
const router = express.Router()

router.patch('/update/constract/detail', validateToken, updateContractDetails)
router.patch('/update/work/type', validateToken, updateTypeOfWork)

export default router;
