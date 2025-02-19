import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import orderRoute from "./routes/orderRoute.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/users", userRoute);
app.use("/products", productRoute);
app.use("/orders", orderRoute);

app.listen(process.env.PORT || 3000, () =>
  console.log(`server staring on ${process.env.PORT}`)
);
