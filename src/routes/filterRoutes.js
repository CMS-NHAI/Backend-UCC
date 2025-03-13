import express from "express";
const router = express.Router()
import { validateToken } from "../middlewares/validateToken.js";
import { getFilterData } from "../controllers/filterController.js";

router.get('/filter/list', validateToken, getFilterData);


export default router;