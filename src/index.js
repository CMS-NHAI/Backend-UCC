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

app.use("/api", centralizedRoutes);

app.use(express.json());

const PORT =  process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});



