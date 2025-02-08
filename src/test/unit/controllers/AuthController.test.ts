import { createRequest, createResponse } from "node-mocks-http";
import { AuthController } from "../../../controllers/AuthController";
import User from "../../../models/User";
import { checkPassword, hasPassword } from "../../../util/auth";
import { generateToken } from "../../../util/token";
import { AuthEmail } from "../../../emails/AuthEmail";
import { generateJWT } from "../../../util/jwt";

jest.mock("../../../models/User");
jest.mock("../../../util/auth");
jest.mock("../../../util/token");
jest.mock("../../../util/jwt");

describe("AuthController.createAccount", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should return a 409 status and an error message if the email is already register", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(true);

    const req = createRequest({
      method: "POST",
      url: "/api/auth/create-account",
      body: {
        email: "test@test.com",
        password: "123456",
      },
    });

    const res = createResponse();

    await AuthController.createAccount(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(409);

    expect(data).toHaveProperty(
      "error",
      "Un usuario con ese email ya registrado",
    );

    expect(User.findOne).toHaveBeenCalled();

    expect(User.findOne).toHaveBeenCalledTimes(1);
  });

  test("should register a new user and return a success message", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/create-account",
      body: {
        email: "test@test.com",
        password: "123456",
        name: "TEST Name",
      },
    });

    const res = createResponse();

    const mockUser = { ...req.body, save: jest.fn() };

    (User.create as jest.Mock).mockResolvedValue(mockUser);

    (hasPassword as jest.Mock).mockResolvedValue("hashedpassword");

    (generateToken as jest.Mock).mockReturnValue("123456");

    jest
      .spyOn(AuthEmail, "sendConfirmationEmail")
      .mockImplementation(() => Promise.resolve());

    await AuthController.createAccount(req, res);

    expect(User.create).toHaveBeenCalledWith(req.body);

    expect(User.create).toHaveBeenCalledTimes(1);

    expect(mockUser.save).toHaveBeenCalled();

    expect(mockUser.password).toBe("hashedpassword");

    expect(mockUser.token).toBe("123456");

    expect(AuthEmail.sendConfirmationEmail).toHaveBeenCalledWith({
      name: req.body.name,
      email: req.body.email,
      token: "123456",
    });

    expect(AuthEmail.sendConfirmationEmail).toHaveBeenCalledTimes(1);

    expect(res.statusCode).toBe(201);
  });
});

describe("AuthController.login", () => {
  test("should return a 404 if user is not found", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "123456",
      },
    });

    const res = createResponse();

    await AuthController.login(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(404);

    expect(data).toEqual({ error: "Usuario no encontrado" });

    // expect(data).toHaveProperty("error", "Usuario no encontrado");
  });

  test("should return a 403 if account has not been confirmed", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@test.com",
      password: "123456",
      confirmed: false,
    });

    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "123456",
      },
    });

    const res = createResponse();

    await AuthController.login(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(403);

    expect(data).toEqual({ error: "La cuenta no ha sido confirmada" });
  });

  test("should return a 401 if the password is incorrect", async () => {
    const userMock = {
      id: 1,
      email: "test@test.com",
      password: "123456",
      confirmed: true,
    };

    (User.findOne as jest.Mock).mockResolvedValue(userMock);

    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "123456",
      },
    });

    const res = createResponse();

    (checkPassword as jest.Mock).mockResolvedValue(false);

    await AuthController.login(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(401);

    expect(data).toEqual({ error: "Password incorrecto" });

    expect(checkPassword).toHaveBeenCalledWith(
      req.body.password,
      userMock.password,
    );

    expect(checkPassword).toHaveBeenCalledTimes(1);
  });

  test("should return a JWT if authotication is succesfull", async () => {
    const userMock = {
      id: 1,
      email: "test@test.com",
      password: "123456",
      confirmed: true,
    };

    (User.findOne as jest.Mock).mockResolvedValue(userMock);

    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "123456",
      },
    });

    const res = createResponse();

    const fakeJWT = "fake_JWT";

    (checkPassword as jest.Mock).mockResolvedValue(true);

    (generateJWT as jest.Mock).mockReturnValue(fakeJWT);

    await AuthController.login(req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);

    expect(data).toEqual(fakeJWT);


    expect(generateJWT).toHaveBeenCalledTimes(1);
    
    expect(generateJWT).toHaveBeenCalledWith(userMock.id);
  });


});




