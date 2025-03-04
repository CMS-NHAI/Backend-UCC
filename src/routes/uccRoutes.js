import express from "express";
import { STRING_CONSTANT } from "../constants/stringConstant.js";
import { getFile, getRequiredStretch, getTypeOfWork, getUcc,uploadFile } from "../controllers/uccController.js";
import validate from "../middlewares/validate.js";
import { validateToken } from "../middlewares/validateToken.js";
import { getRequiredStretchParamsValidationSchema, getRequiredStretchQueryValidationSchema } from "../validations/uccValidation.js";
const router = express.Router()

router.get('/list', getUcc);
router.get('/type_of_work', validateToken, getTypeOfWork);
router.get(
    '/getRequiredStretch/:uccId',
    validateToken, validate(getRequiredStretchQueryValidationSchema, STRING_CONSTANT.QUERY),
    validate(getRequiredStretchParamsValidationSchema, STRING_CONSTANT.PARAMS), getRequiredStretch
);
router.post('/upload',validateToken, uploadFile);
router.get('/getFile',validateToken, getFile);

export default router;