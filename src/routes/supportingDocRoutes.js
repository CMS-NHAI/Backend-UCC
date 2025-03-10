import express from "express";
const router = express.Router()

import { uploadSupportingDocument, getSupportingDoc, deleteSupportingDoc } from "../controllers/supportingDocumentController.js";
import { validateToken } from "../middlewares/validateToken.js";

router.post('/upload/supporting/document', validateToken, uploadSupportingDocument)
router.get('/supporting/document/list', validateToken, getSupportingDoc);
router.delete('/delete/supporting/document', validateToken, deleteSupportingDoc);

export default router;