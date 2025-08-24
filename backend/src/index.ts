import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.listen(process.env.BACKEND_PORT, () => {
  console.log(`Listening on PORT ${process.env.BACKEND_PORT}`);
});
