import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL no está definida.");
}

export const db = new Sequelize(dbUrl, {
  models: [__dirname + "/../models/**/*"],
  //   define:{
  // timestamps:false
  // },
  logging: false,
  dialectOptions: {
    ssl: {
      require: false,
    },
  },
});
