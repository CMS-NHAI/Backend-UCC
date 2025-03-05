import express from "express";
import { STRING_CONSTANT } from "../constants/stringConstant.js";
import { getFile, getRequiredStretch, getTypeOfWork, getUcc,uploadFile, getImplementationModes } from "../controllers/uccController.js";
import { getDistrict,  getSchemes, getStates,  insertTypeOfWorkController,deleteFile, } from "../controllers/uccController.js";
// import { getDistrict, getRequiredStretch,  getSchemes, getStates, getTypeOfWork, getUcc,insertTypeOfWorkController,uploadFile,deleteFile,getFile } from "../controllers/uccController.js";

import validate from "../middlewares/validate.js";
import { validateToken } from "../middlewares/validateToken.js";
import { getRequiredStretchParamsValidationSchema, getRequiredStretchQueryValidationSchema, typeOfWorkRequestBodySchema } from "../validations/uccValidation.js";
import { getChainageByUcc } from "../controllers/chainageController.js";
const router = express.Router()

router.get('/list', getUcc);
router.get('/type_of_work', validateToken, getTypeOfWork);
router.get('/schemes', validateToken, getSchemes);
router.get('/states', validateToken, getStates);
router.get('/districtsViaStateId', validateToken, getDistrict);
router.get('/getChainageByUcc', validateToken, getChainageByUcc);


router.get(
    '/getRequiredStretch/:uccId',
    validateToken, validate(getRequiredStretchQueryValidationSchema, STRING_CONSTANT.QUERY),
    validate(getRequiredStretchParamsValidationSchema, STRING_CONSTANT.PARAMS), getRequiredStretch
);
router.post('/upload',validateToken, uploadFile);
router.get('/getFile',validateToken, getFile);
router.get('/getImplementationModes',validateToken,getImplementationModes);
router.post(
    '/insertTypeOfWork',
    validateToken,
    validate(typeOfWorkRequestBodySchema),
    insertTypeOfWorkController
);
router.post('/deleteFile',validateToken,deleteFile);

export default router;