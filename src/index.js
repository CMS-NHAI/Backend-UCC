import express from "express";
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import centralizedRoutes from './routes/index.js'

const app = express();

app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cors());
app.use(express.json());

app.use("/api", centralizedRoutes);


const PORT =  process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});



