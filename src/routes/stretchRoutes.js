/**
 * @author Deepak
 */
import express from "express";
import { STRING_CONSTANT } from "../constants/stringConstant.js";
import { fetchMyStretches, getRequiredStretch } from "../controllers/stretchesController.js";
import validate from "../middlewares/validate.js";
import { validateToken } from "../middlewares/validateToken.js";
import { getRequiredStretchParamsValidationSchema, getRequiredStretchQueryValidationSchema } from "../validations/uccValidation.js";
const router = express.Router()

router.get(
    '/getRequiredStretch/:uccId',
    validateToken, validate(getRequiredStretchQueryValidationSchema, STRING_CONSTANT.QUERY),
    validate(getRequiredStretchParamsValidationSchema, STRING_CONSTANT.PARAMS), getRequiredStretch
);
router.get('/myStretches', validateToken, fetchMyStretches)

export default router;