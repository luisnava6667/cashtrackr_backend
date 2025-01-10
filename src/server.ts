import express from "express";
import colors from "colors";
import morgan from "morgan";
import { db } from "./config/db";

async function connectDB() {
  try {
    await db.authenticate();
    db.sync();
    console.log(colors.green.bold("Conexion exitosa a la base de datos"));
  } catch (error) {
    // console.log(error);
    console.log(colors.red.bold("Fallo la conexión a la base de datos"));
  }
}

connectDB();

const app = express();

app.use(morgan("dev"));

app.use(express.json());

export default app;

