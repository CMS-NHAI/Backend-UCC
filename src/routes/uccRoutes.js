import express from "express";
import { getUcc } from "../controllers/uccController.js";
import validate from "../middlewares/validate.js";
const router = express.Router()

router.get('/list', validate(userValidationSchema), getUcc);

export default router;