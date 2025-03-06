import express from "express";
const router = express.Router()
import { saveContractDetails } from "../controllers/saveContractController.js";
import validate from "../middlewares/validate.js";

import { STRING_CONSTANT } from "../constants/stringConstant.js";

import { uploadSupportingDocument, getSupportingDoc } from "../controllers/supportingDocumentController.js";
import { validateToken } from "../middlewares/validateToken.js";

router.post('/upload/supporting/document', validateToken, uploadSupportingDocument)
router.get('/supporting/document/list', getSupportingDoc);


export default router;