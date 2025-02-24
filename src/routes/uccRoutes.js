import express  from "express";
import { getTypeOfWork, getUcc } from "../controllers/uccController.js";
import validate from "../middlewares/validate.js";
import { validateToken } from "../middlewares/validateToken.js";
const router = express.Router()

router.get('/list', getUcc);
router.get('/type_of_work', validateToken, getTypeOfWork);
export default router;