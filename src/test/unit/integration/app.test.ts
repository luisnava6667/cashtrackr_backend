import request from "supertest";
import server, { connectDB } from "../../../server";
import { AuthController } from "../../../controllers/AuthController";
import { body } from 'express-validator';

describe("Authentication - Create Account", () => {
  beforeAll(async () => {
    await connectDB();
  });

  test("should display validation errors form is empty", async () => {
    const response = await request(server)
      .post("/api/auth/create-account")
      .send({});

    const createAccountMock = jest.spyOn(AuthController, "createAccount");

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty("errors");

    expect(response.body.errors).toHaveLength(3);

    expect(response.body.errors).not.toHaveLength(2);

    expect(response.statusCode).not.toBe(200);

    expect(createAccountMock).not.toHaveBeenCalled();
  });

  test("should return 400 status code when the email is invalid", async () => {
    const response = await request(server)
      .post("/api/auth/create-account")
      .send({
        name: "luis",
        password: "12345678",
        email: "not_valid_email",
      });

    const createAccountMock = jest.spyOn(AuthController, "createAccount");

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty("errors");

    expect(response.body.errors[0].msg).toBe("El email no es válido");

    expect(response.body.errors).toHaveLength(1);

    expect(response.body.errors).not.toHaveLength(2);

    expect(response.statusCode).not.toBe(200);

    expect(createAccountMock).not.toHaveBeenCalled();
  });

  test("should return 400 status code when the password is less than 8 characters ", async () => {
    const response = await request(server)
      .post("/api/auth/create-account")
      .send({
        name: "luis",
        password: "short",
        email: "email@email.com",
      });

    const createAccountMock = jest.spyOn(AuthController, "createAccount");

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty("errors");

    expect(response.body.errors).toHaveLength(1);

    expect(response.body.errors[0].msg).toBe(
      "El password es muy corto, mínimo 8 caracteres",
    );

    expect(response.body.errors).not.toHaveLength(2);

    expect(response.statusCode).not.toBe(200);

    expect(createAccountMock).not.toHaveBeenCalled();
  });

  test("should register a new user successfully", async () => {
    const userData = {
      name: "luis",
      password: "12345678",
      email: "email@email.com",
    };

    const response = await request(server)
      .post("/api/auth/create-account")
      .send(userData);

    expect(response.statusCode).toBe(201);

    expect(response.statusCode).not.toBe(400);

    expect(response.body).not.toHaveProperty("errors");
  });

  test("should register 409 status code conflic when a user is already registered", async () => {
    const userData = {
      name: "luis",
      password: "12345678",
      email: "email@email.com",
    };

    const response = await request(server)
      .post("/api/auth/create-account")
      .send(userData);

      expect(response.statusCode).toBe(409);
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBe("Un usuario con ese email ya registrado");

    expect(response.statusCode).not.toBe(400);
    
    expect(response.statusCode).not.toBe(201);

    expect(response.body).not.toHaveProperty("errors");
  });
});




