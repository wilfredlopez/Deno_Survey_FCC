import {
  RouterContext,
  Payload,
  Jose,
  setExpiration,
  makeJwt,
} from "../deps.ts";
import User from "../models/User.ts";
import { JWT_SECRET } from "../constants.ts";
import BaseController from "./BaseController.ts";

class AuthController extends BaseController {
  private static createJWTToken(payload: any) {
    const HOUR = (60 * 60) * 1000;
    const TIME = 5 * HOUR;
    const pl: Payload = {
      iss: payload,
      exp: setExpiration(new Date().getTime() + TIME),
    };
    const header: Jose = {
      alg: "HS256",
      typ: "JWT",
    };
    return makeJwt({ header, payload: pl, key: JWT_SECRET });
  }
  private static isInvalidLoginInput(email: string, password: string) {
    let invalid = false;
    if (!email) {
      return true;
    }
    if (!password) {
      return true;
    }

    if (password && password.trim() === "") {
      return true;
    }
    if (email && email.trim() === "") {
      return true;
    }

    return invalid;
  }

  async login(context: RouterContext) {
    const { value: {email, password} } = await context.request.body();

    if (AuthController.isInvalidLoginInput(email, password)) {
      this.sendErrorResponse(context, {
        message:
          "Invalid Request. Please make sure to provide email and password fields.",
        statusCode: 400,
      });
      return;
    }

    try {
      const user = await User.findOne({
        email,
      }) as User | null;
      if (!user) {
        this.sendErrorResponse(context, {
          message: "Unable to login.",
          statusCode: 404,
        });
        return;
      }
      const isValidPassword = User.comparePassword(password, user.password);

      if (!isValidPassword) {
        this.sendErrorResponse(
          context,
          {
            message: "Unable to login.",
            statusCode: 401,
          },
        );
        return;
      }
      const jwt = AuthController.createJWTToken(user.email);

      const { mongoCollection, password: _, ...rest } = user;

      context.response.body = {
        ...rest,
        jwt,
      };
    } catch (error) {
      this.sendErrorResponse(
        context,
        { message: error.message, statusCode: 500 },
      );
    }
  }

  async register(context: RouterContext) {
    const { value: {name, email, password} } = await context.request.body();

    const exist = await User.findOne({
      email,
    });
    if (exist) {
      context.response.status = 422;
      context.response.body = {
        message: "User already in use.",
      };
      return;
    }
    try {
      const hashedPassword = User.hashPassword(password);
      const user = new User({ name, email, password: hashedPassword });
      await user.save();

      const { mongoCollection, password: _, ...rest } = user;
      context.response.body = rest;
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(context);
    }
  }

  async getAllUsers(context: RouterContext) {
    const users = await User.findAll();
    context.response.body = users;
  }
}

const authController = new AuthController();

export default authController;
