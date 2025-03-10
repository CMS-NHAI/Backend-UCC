import express from "express";
import { saveContractDetails } from "../controllers/saveContractController.js";
import validate from "../middlewares/validate.js";
import { validateToken } from "../middlewares/validateToken.js";
import { STRING_CONSTANT } from "../constants/stringConstant.js";
import { getDistrict, getSchemes, getStates, getTypeOfWork, getUcc,insertTypeOfWorkController,uploadFile,deleteFile,getFile,getImplementationModes, getRos, getPIUByROId,getuserUccDetails,getBasicDetailsOfReviewPage} from "../controllers/uccController.js";
import { getRequiredStretchParamsValidationSchema, getRequiredStretchQueryValidationSchema, typeOfWorkRequestBodySchema,saveContractDetailsSchema,contractValidationSchema } from "../validations/uccValidation.js";
import { getChainageByUcc } from "../controllers/chainageController.js";
import { updateContractDetails } from "../controllers/updateContractController.js";

const router = express.Router()

router.get('/list', getUcc);
router.get('/type_of_work', validateToken, getTypeOfWork);
router.get('/schemes', validateToken, getSchemes);
router.get('/states', validateToken, getStates);
router.get('/districtsViaStateId', validateToken, getDistrict);
router.post('/getChainageByUcc', validateToken, getChainageByUcc);
router.get('/ROs', validateToken, getRos);
router.get('/PIUbyROId', validateToken, getPIUByROId);



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
router.post('/saveContractDetails',validateToken,validate(saveContractDetailsSchema),saveContractDetails);
router.post('/getUccDetails',validateToken,validate(contractValidationSchema),getuserUccDetails);
router.patch('/update/constract/detail', validateToken, updateContractDetails);

router.get('/getBasicDetailsOfReviewPage',validateToken,getBasicDetailsOfReviewPage);

export default router;
