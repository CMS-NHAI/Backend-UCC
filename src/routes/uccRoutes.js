import express from "express";
import { deleteFile, getDistrict, getFile, getSchemes, getStates, getTypeOfWork, getUcc, insertTypeOfWorkController, uploadFile } from "../controllers/uccController.js";
import validate from "../middlewares/validate.js";
import { validateToken } from "../middlewares/validateToken.js";
import { typeOfWorkRequestBodySchema } from "../validations/uccValidation.js";
const router = express.Router()

router.get('/list', getUcc);
router.get('/type_of_work', validateToken, getTypeOfWork);
router.get('/schemes', validateToken, getSchemes);
router.get('/states', validateToken, getStates);
router.get('/districtsViaStateId', validateToken, getDistrict);

router.post('/upload',validateToken, uploadFile);
router.get('/getFile',validateToken, getFile);
router.post(
    '/insertTypeOfWork',
    validateToken,
    validate(typeOfWorkRequestBodySchema),
    insertTypeOfWorkController
);
router.post('/deleteFile',validateToken,deleteFile);

export default router;