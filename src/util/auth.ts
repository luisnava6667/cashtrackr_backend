import bcrypt from "bcrypt";
import { Request, Response } from "express";

export const hasPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);

  return await bcrypt.hash(password, salt);
};

export const checkPassword = async (password: string, passwordHash: string) => {
  return await bcrypt.compare(password, passwordHash);
};
