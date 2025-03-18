import express from "express";
import { validateToken } from "../middlewares/validateToken.js";
import { updateContractDetails, updateTypeOfWork,updateNHdetails } from "../controllers/updateContractController.js";
import validate from "../middlewares/validate.js";
import { updateNHDetailsSchema } from "../validations/uccValidation.js";
const router = express.Router()

router.patch('/update/constract/detail', validateToken, updateContractDetails)
router.patch('/update/work/type', validateToken, updateTypeOfWork)
router.patch('/update/NHDetails',validateToken,validate(updateNHDetailsSchema),updateNHdetails)

export default router;
