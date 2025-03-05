import express from "express";

import { deleteFile, getDistrict, getFile, getSchemes, getStates, getTypeOfWork, getUcc, insertTypeOfWorkController, uploadFile, getImplementationModes } from "../controllers/uccController.js";

import { validateToken } from "../middlewares/validateToken.js";

import { STRING_CONSTANT } from "../constants/stringConstant.js";

import { getDistrict, getRequiredStretch,  getSchemes, getStates, getTypeOfWork, getUcc,insertTypeOfWorkController,uploadFile,deleteFile,getFile, uploadSupportingDocument } from "../controllers/uccController.js";

import validate from "../middlewares/validate.js";
import { getRequiredStretchParamsValidationSchema, getRequiredStretchQueryValidationSchema, typeOfWorkRequestBodySchema } from "../validations/uccValidation.js";
import { getChainageByUcc } from "../controllers/chainageController.js";

const router = express.Router()

router.get('/list', getUcc);
router.get('/type_of_work', validateToken, getTypeOfWork);
router.get('/schemes', validateToken, getSchemes);
router.get('/states', validateToken, getStates);
router.get('/districtsViaStateId', validateToken, getDistrict);
router.get('/getChainageByUcc', validateToken, getChainageByUcc);


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
router.post('/upload/supporting/document', validateToken, uploadSupportingDocument)

export default router;