/**
 * @author Deepak
 */
import express from "express";
import { STRING_CONSTANT } from "../constants/stringConstant.js";
import { fetchMyStretches, fetchStretchDetails, getRequiredStretch, testUccTimings } from "../controllers/stretchesController.js";
import validate from "../middlewares/validate.js";
import { validateToken } from "../middlewares/validateToken.js";
import { getRequiredStretchParamsValidationSchema, getRequiredStretchQueryValidationSchema } from "../validations/uccValidation.js";
const router = express.Router()

router.get(
    '/getRequiredStretch/:uccId',
    validateToken, validate(getRequiredStretchQueryValidationSchema, STRING_CONSTANT.QUERY),
    validate(getRequiredStretchParamsValidationSchema, STRING_CONSTANT.PARAMS), getRequiredStretch
);
router.post('/myStretches', validateToken, fetchMyStretches);
router.get('/stretchDetails/:stretchId', validateToken, fetchStretchDetails);
router.get('/uccDataTest/:stretchId', validateToken, testUccTimings);

export default router;