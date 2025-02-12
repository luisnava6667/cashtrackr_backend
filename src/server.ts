import express from "express";
import colors from "colors";
import morgan from "morgan";
import { db } from "./config/db";
import budgetRouter from "./routes/budgetRouter";
import authRouter from "./routes/authRouter";
import { limiter } from "./config/limiter";

export async function connectDB() {
  try {
    await db.authenticate();
    db.sync();
    // console.log(colors.green.bold("Conexion exitosa a la base de datos"));
  } catch (error) {
    // console.log(error);
    // console.log(colors.red.bold("Fallo la conexión a la base de datos"));
  }
}

connectDB();

const app = express();

app.use(morgan("dev"));

app.use(express.json());

// app.use(limiter)

app.use("/api/budgets", budgetRouter);
// Routes for Auth
app.use("/api/auth", authRouter);

export default app;
