import request from "supertest";
import server, { connectDB } from "../../../server";
import { AuthController } from "../../../controllers/AuthController";
import { body } from "express-validator";
import User from "../../../models/User";
import * as authUtil from "../../../util/auth";
import * as jwtUtil from "../../../util/jwt";

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
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Un usuario con ese email ya registrado");

    expect(response.statusCode).not.toBe(400);

    expect(response.statusCode).not.toBe(201);

    expect(response.body).not.toHaveProperty("errors");
  });
});

describe("Authentication - Account Confirmation with token", () => {
  test("should display error if token is empty or not valid", async () => {
    const response = await request(server)
      .post("/api/auth/confirm-account")
      .send({
        token: "not-valid",
      });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("errors");

    expect(response.body.errors).toHaveLength(1);

    expect(response.body.errors[0].msg).toBe("Token no válido");
  });

  test("should display error if token doesnt exist", async () => {
    const response = await request(server)
      .post("/api/auth/confirm-account")
      .send({
        token: "123456",
      });

    expect(response.status).toBe(401);

    expect(response.body).toHaveProperty("error");

    expect(response.body.error).toBe("Token no válido");

    expect(response.status).not.toBe(200);
  });

  test("should confirm accuount with a valid token", async () => {
    const token = globalThis.cashTrackrConfirmationToken;

    const response = await request(server)
      .post("/api/auth/confirm-account")
      .send({ token });

    expect(response.status).toBe(200);

    expect(response.body).toBe("Cuenta confirmada correctamente");

    expect(response.status).not.toBe(400);
  });
});

describe("Authentication - Login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should display validation errors when the form is empty", async () => {
    const response = await request(server).post("/api/auth/login").send({});

    const loginMock = jest.spyOn(AuthController, "login");

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty("errors");

    expect(response.body.errors).toHaveLength(2);

    expect(response.body.errors).not.toHaveLength(1);

    expect(response.statusCode).not.toBe(200);

    expect(loginMock).not.toHaveBeenCalled();
  });

  test("should return 400 bad request whe the emial is invalid", async () => {
    const response = await request(server).post("/api/auth/login").send({
      password: "password",
      email: "not_valid_email",
    });

    const loginMock = jest.spyOn(AuthController, "login");

    expect(response.statusCode).toBe(400);

    expect(response.body).toHaveProperty("errors");

    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].msg).toBe("El email no es válido");

    expect(response.body.errors).not.toHaveLength(2);

    expect(response.statusCode).not.toBe(200);

    expect(loginMock).not.toHaveBeenCalled();
  });

  test("should return a  400 error if the user is not found", async () => {
    const response = await request(server).post("/api/auth/login").send({
      password: "password",
      email: "test@email.com",
    });

    expect(response.statusCode).toBe(404);

    expect(response.body).toHaveProperty("error");

    expect(response.body.error).toBe("Usuario no encontrado");

    expect(response.statusCode).not.toBe(200);
  });

  test("should return a 403 error if the user account is not confirm", async () => {
    (jest.spyOn(User, "findOne") as jest.Mock).mockResolvedValue({
      id: 1,
      name: "luis",
      password: "password",
      email: "user_not_confirmed@email.com",
      confirmed: false,
    });

    const response = await request(server).post("/api/auth/login").send({
      password: "password",
      email: "user_not_confirmed@email.com",
    });

    expect(response.statusCode).toBe(403);

    expect(response.body).toHaveProperty("error");

    expect(response.body.error).toBe("La cuenta no ha sido confirmada");

    expect(response.statusCode).not.toBe(200);

    expect(response.statusCode).not.toBe(404);
  });

  test("should return a 403 error if the user account is not confirm", async () => {
    const userData = {
      name: "TEST",
      password: "password",
      email: "user_not_confirmed@email.com",
    };

    await request(server).post("/api/auth/create-account").send(userData);

    const response = await request(server).post("/api/auth/login").send({
      password: userData.password,
      email: userData.email,
    });

    expect(response.statusCode).toBe(403);

    expect(response.body).toHaveProperty("error");

    expect(response.body.error).toBe("La cuenta no ha sido confirmada");

    expect(response.statusCode).not.toBe(200);

    expect(response.statusCode).not.toBe(404);
  });

  test("should return a 401 error if the password is incorrect", async () => {
    const finOne = (jest.spyOn(User, "findOne") as jest.Mock).mockResolvedValue(
      {
        id: 1,
        name: "luis",
        password: "password",
        confirmed: true,
      },
    );

    const checkPassword = jest
      .spyOn(authUtil, "checkPassword")
      .mockResolvedValue(false);

    const response = await request(server).post("/api/auth/login").send({
      password: "wrongPassword",
      email: "test@email.com",
    });

    expect(response.statusCode).toBe(401);

    expect(response.body).toHaveProperty("error");

    expect(response.body.error).toBe("Password incorrecto");

    expect(response.statusCode).not.toBe(200);

    expect(response.statusCode).not.toBe(404);

    expect(response.statusCode).not.toBe(403);

    expect(finOne).toHaveBeenCalledTimes(1);

    expect(checkPassword).toHaveBeenCalledTimes(1);
  });

  test("should return a jwt", async () => {
    const finOne = (jest.spyOn(User, "findOne") as jest.Mock).mockResolvedValue(
      {
        id: 1,
        password: "hashPassword",
        confirmed: true,
      },
    );

    const checkPassword = jest
      .spyOn(authUtil, "checkPassword")
      .mockResolvedValue(true);

    const generateJWT = jest
      .spyOn(jwtUtil, "generateJWT")
      .mockReturnValue("jwt_token");

    const response = await request(server).post("/api/auth/login").send({
      password: "correctPassword",
      email: "test@email.com",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual("jwt_token");

    expect(finOne).toHaveBeenCalled();
    expect(finOne).toHaveBeenCalledTimes(1);

    expect(checkPassword).toHaveBeenCalled();
    expect(checkPassword).toHaveBeenCalledTimes(1);

    expect(checkPassword).toHaveBeenCalledWith(
      "correctPassword",
      "hashPassword",
    );

    expect(generateJWT).toHaveBeenCalled();
    expect(generateJWT).toHaveBeenCalledTimes(1);
    expect(generateJWT).toHaveBeenCalledWith(1);
  });
});

let jwt: string;

async function authenticateUser() {
  const response = await request(server).post("/api/auth/login").send({
    password: "12345678",
    email: "email@email.com",
  });

  jwt = response.body;
  expect(response.statusCode).toBe(200);
}

describe("GET /api/bugets", () => {
  beforeAll(() => {
    jest.restoreAllMocks();
  });

  beforeAll(async () => {
    await authenticateUser();
  });

  test("should reject unauthenticated access to budgets without a jwt", async () => {
    const response = await request(server).get("/api/budgets");

    expect(response.status).toBe(401);

    expect(response.body.error).toBe("No autorizado");
  });

  test("should reject unauthenticated access to budgets without a valid jwt", async () => {
    const response = await request(server)
      .get("/api/budgets")
      .auth("not_valid", {
        type: "bearer",
      });

    expect(response.status).toBe(500);

    expect(response.body.error).toBe("Token no válido");
  });

  test("should allow authenticated access to budgets with a valid jwt", async () => {
    const response = await request(server).get("/api/budgets").auth(jwt, {
      type: "bearer",
    });

    expect(response.body).toHaveLength(0);

    expect(response.status).not.toBe(401);

    expect(response.body.error).not.toBe("No autorizado");
  });
});

describe("POST /api/bugets", () => {
  beforeAll(async () => {
    await authenticateUser();
  });

  test("should reject unauthenticated post request to budgets without a jwt", async () => {
    const response = await request(server).post("/api/budgets");

    expect(response.status).toBe(401);

    expect(response.body.error).toBe("No autorizado");
  });

  test("should display validation when the form is submitted with invalid data", async () => {
    const response = await request(server)
      .post("/api/budgets")
      .auth(jwt, { type: "bearer" })
      .send({});

    expect(response.status).toBe(400);

    expect(response.body.errors).toHaveLength(4);
  });
});

describe("GET /api/budgets/:id", () => {
  beforeAll(async () => {
    await authenticateUser();
  });

  test("should reject unauthenticated get request to budget id without a jwt", async () => {
    const response = await request(server).get("/api/budgets/1");

    expect(response.status).toBe(401);

    expect(response.body.error).toBe("No autorizado");
  });

  test("should return 400 bad request when id is not valid", async () => {
    const response = await request(server)
      .get("/api/budgets/not_valid")
      .auth(jwt, { type: "bearer" });

    expect(response.status).toBe(400);

    expect(response.status).not.toBe(401);

    expect(response.body.errors).toHaveLength(1);

    expect(response.body.errors[0].msg).toBe("ID no válido");

    expect(response.body.errors).toBeTruthy();

    expect(response.body.error).not.toBe("No autorizado");
  });

  test("should return 404 not found when a budget doesnt exists", async () => {
    const response = await request(server)
      .get("/api/budgets/3000")
      .auth(jwt, { type: "bearer" });

    expect(response.status).toBe(404);

    expect(response.status).not.toBe(401);

    expect(response.status).not.toBe(400);

    expect(response.body.error).toBe("Presupuesto no encontrado");
  });

  test("should return a single budget by id", async () => {
    const response = await request(server)
      .get("/api/budgets/1")
      .auth(jwt, { type: "bearer" });
    console.log(response.body);

    expect(response.status).toBe(200);

    expect(response.status).not.toBe(401);

    expect(response.status).not.toBe(400);

    expect(response.status).not.toBe(404);
  });
});

describe("PUT /api/budgets/:id", () => {
  beforeAll(async () => {
    await authenticateUser();
  });

  test("should reject unauthenticated put request to budget id without a jwt", async () => {
    const response = await request(server).put("/api/budgets/1");

    expect(response.status).toBe(401);

    expect(response.body.error).toBe("No autorizado");
  });

  test("should display validation errors if the form is empty", async () => {
    const response = await request(server)
      .put("/api/budgets/1")
      .auth(jwt, { type: "bearer" })
      .send({});

    expect(response.status).toBe(400);

    expect(response.body.errors).toBeTruthy()
    expect(response.body.errors).toHaveLength(4)
  });

  test("should update a budget budget by id and return a success message", async () => {
    const response = await request(server)
      .put("/api/budgets/1")
      .auth(jwt, { type: "bearer" })
      .send({
        name: "update budgets",
        amount: 1000,
      });

    expect(response.status).toBe(200);

    expect(response.body).toBe('Presupuesto actualizado correctamente')
  });
});

describe("DELETE /api/budgets/:id", () => {
  beforeAll(async () => {
    await authenticateUser();
  });

  test("should reject unauthenticated put request to budget id without a jwt", async () => {
    const response = await request(server).delete("/api/budgets/1");

    expect(response.status).toBe(401);

    expect(response.body.error).toBe("No autorizado");
  });

  test("should return 404 not found when a budget doesnt exist", async () => {
    const response = await request(server)
      .delete("/api/budgets/300")
      .auth(jwt, { type: "bearer" })

    expect(response.status).toBe(404);

    expect(response.body.error).toBe("Presupuesto no encontrado")
  });

  test("should delete a budget and return a success message", async () => {
    const response = await request(server)
      .delete("/api/budgets/1")
      .auth(jwt, { type: "bearer" })

    expect(response.status).toBe(200);

    expect(response.body).toBe('Presupuesto eliminado')
  });
});

