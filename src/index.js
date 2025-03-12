import express from "express";
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import centralizedRoutes from './routes/index.js'
import { STATUS_CODES } from './constants/statusCodeConstants.js'
import { APP_CONSTANTS } from './constants/appConstants.js'
import dotenv from 'dotenv';
import { addUccLogService } from "./services/uccLogService.js";
import { validateToken } from "./middlewares/validateToken.js";
dotenv.config();

const app = express();

app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cors());
app.use(express.json());

app.use("/backend/ucc", centralizedRoutes);

app.get('/backend', (req, res) => {
  res.status(STATUS_CODES.OK).send({
    message: `Welcome to UCC-Service Datalake 3.0 ${APP_CONSTANTS.APP_NAME} v${APP_CONSTANTS.VERSION}`,
  });
});

// only for testing purpose
app.post("/backend/ucc/log", validateToken, async (req, res)=>{

    const userId = req.user?.user_id;
    const { ucc_id , changed_field, new_value} = req.body
    const output = await addUccLogService(userId, ucc_id , changed_field, new_value)
    res.status(200).json({ success:true, message:"Back log created successfully.", data: output})

})


const PORT =  process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});



